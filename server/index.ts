import 'dotenv/config';
import express from 'express';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { openStore, exampleState } from './store.js';
import { dateSchema, taskSchema, blockSchema, availabilitySchema, reportSchema } from './validation.js';
import { importNotion, notionStatus } from './notion.js';
import { today } from '../shared/domain.js';

const app=express();
const store=openStore(process.env.DATABASE_PATH||process.env.COMPASSO_DEFAULT_DB||'./data/compasso.sqlite');
const port=Number(process.env.PORT||3000);
app.disable('x-powered-by');
// Bind to loopback and reject cross-site writes, since this personal app has no login.
app.use((req,res,next)=>{
  const origin=req.headers.origin;
  if(origin&&origin!==`http://localhost:${port}`&&origin!==`http://127.0.0.1:${port}`) {res.status(403).json({error:'Origem não permitida.'});return;}
  if(!['GET','HEAD'].includes(req.method)&&!req.is('application/json')) {res.status(415).json({error:'Use JSON.'});return;}
  next();
});
app.use(express.json({limit:'1mb'}));
app.get('/api/health',(_req,res)=>res.json({ok:true}));
app.get('/api/state',(_req,res)=>res.json(store.read()));
app.get('/api/notion',(_req,res)=>res.json(notionStatus()));
app.get('/api/backup',(_req,res)=>{res.setHeader('Content-Disposition',`attachment; filename="dcarvalho-${today()}.json"`);res.json({version:1,exportedAt:new Date().toISOString(),state:store.read(),trash:store.trash()});});

// Revision checks prevent a stale second browser tab from overwriting recent edits.
app.use('/api',(req,res,next)=>{
  if(req.method==='GET') {next();return;}
  if(req.path==='/notion/sync') {next();return;}
  const state=store.read();
  if(req.body?.revision!==state.revision) {res.status(409).json({error:'Os dados mudaram em outra aba. A tela foi atualizada; tente novamente.'});return;}
  res.locals.state=state;next();
});
app.post('/api/examples',(_req,res)=>{
  const state=res.locals.state;
  if(state.tasks.length||state.blocks.length) {res.status(400).json({error:'Os exemplos só podem ser carregados em uma lista vazia.'});return;}
  res.json(store.save({...exampleState(),revision:state.revision}));
});
app.delete('/api/examples',(_req,res)=>{
  const state=res.locals.state;
  const ids=new Set(state.tasks.filter((t:any)=>t.example).map((t:any)=>t.id));
  state.tasks=state.tasks.filter((t:any)=>!ids.has(t.id));state.blocks=state.blocks.filter((b:any)=>!ids.has(b.taskId));state.timeEntries=state.timeEntries.filter((b:any)=>!ids.has(b.taskId));
  res.json(store.save(state));
});
app.post('/api/tasks',(req,res)=>{
  const input=taskSchema.parse(req.body),state=res.locals.state;
  state.tasks.push({id:randomUUID(),...input,completedAt:input.status==='Concluída'?new Date().toISOString():null,notionId:null,notionUrl:null,dirty:false,example:false,actual:0});
  res.json(store.save(state));
});
app.put('/api/tasks/:id',(req,res)=>{
  const state=res.locals.state,t=state.tasks.find((t:any)=>t.id===req.params.id);
  if(!t) {res.status(404).json({error:'Tarefa não encontrada.'});return;}
  const input=taskSchema.parse(req.body);
  const sharedChanged=(t.notionFields||['title','client','due','priority','status']).some((k:string)=>(input as any)[k]!==t[k]);
  const completedAt=input.status==='Concluída'?(t.completedAt||new Date().toISOString()):null;
  Object.assign(t,input,{completedAt,dirty:t.dirty||!!(t.notionId&&sharedChanged)});
  res.json(store.save(state));
});
app.delete('/api/tasks/:id',(req,res)=>{
  const state=store.removeTask(String(req.params.id));
  if(!state){res.status(404).json({error:'Tarefa não encontrada.'});return;}
  res.json(state);
});
app.post('/api/tasks/:id/restore',(req,res)=>{
  const state=store.restoreTask(String(req.params.id));
  if(!state){res.status(404).json({error:'Tarefa não encontrada na lixeira local.'});return;}
  res.json(state);
});
app.put('/api/availability',(req,res)=>{
  const input=availabilitySchema.parse(req.body),state=res.locals.state;
  state.availability[input.date]=input.hours;res.json(store.save(state));
});
app.post('/api/blocks',(req,res)=>{
  const input=blockSchema.parse(req.body),state=res.locals.state;
  const task=state.tasks.find((t:any)=>t.id===input.taskId);
  if(!task||task.status==='Concluída') {res.status(400).json({error:'Selecione uma tarefa pendente.'});return;}
  state.blocks.push({id:randomUUID(),...input});res.json(store.save(state));
});
app.put('/api/blocks/:id',(req,res)=>{
  const input=blockSchema.parse(req.body),state=res.locals.state;
  const block=state.blocks.find((b:any)=>b.id===req.params.id);
  if(!block||input.taskId!==block.taskId) {res.status(404).json({error:'Bloco não encontrado.'});return;}
  Object.assign(block,input);res.json(store.save(state));
});
app.delete('/api/blocks/:id',(req,res)=>{
  const state=res.locals.state;state.blocks=state.blocks.filter((b:any)=>b.id!==req.params.id);res.json(store.save(state));
});
app.post('/api/time',(req,res)=>{
  const input=blockSchema.parse(req.body),state=res.locals.state;
  const task=state.tasks.find((t:any)=>t.id===input.taskId);
  if(!task) {res.status(404).json({error:'Tarefa não encontrada.'});return;}
  state.timeEntries.push({id:randomUUID(),...input});task.actual=state.timeEntries.filter((t:any)=>t.taskId===task.id).reduce((s:number,t:any)=>s+t.hours,0);res.json(store.save(state));
});
app.delete('/api/time/:id',(req,res)=>{
  const state=res.locals.state,entry=state.timeEntries.find((t:any)=>t.id===req.params.id);
  state.timeEntries=state.timeEntries.filter((t:any)=>t.id!==req.params.id);
  const task=state.tasks.find((t:any)=>t.id===entry?.taskId);
  if(task) task.actual=state.timeEntries.filter((t:any)=>t.taskId===task.id).reduce((s:number,t:any)=>s+t.hours,0);
  res.json(store.save(state));
});
app.put('/api/reports',(req,res)=>{
  const input=reportSchema.parse(req.body),state=res.locals.state;
  state.reports=state.reports.filter((r:any)=>r.key!==input.key);state.reports.push(input);res.json(store.save(state));
});
let syncing=false;
app.post('/api/notion/sync',async(_req,res)=>{
  if(syncing) {res.status(409).json({error:'Uma leitura do Notion já está em andamento.'});return;}
  syncing=true;
  try {res.json(await importNotion(store));} catch(e) {res.status(400).json({error:e instanceof Error?e.message:'Falha ao ler o Notion.'});} finally {syncing=false;}
});
app.post('/api/notion/resolve/:id',(req,res)=>{
  const state=res.locals.state,t=state.tasks.find((t:any)=>t.id===req.params.id);
  if(!t?.notionId) {res.status(404).json({error:'Tarefa não encontrada.'});return;}
  // A deliberate reset permits the NEXT import to apply the remote shared fields.
  t.dirty=false;t.conflict=false;res.json(store.save(state));
});
app.use('/api',(_req,res)=>res.status(404).json({error:'Operação não encontrada.'}));
app.use((err:any,_req:express.Request,res:express.Response,_next:express.NextFunction)=>{
  res.status(err.name==='ZodError'?400:500).json({error:err.name==='ZodError'?'Confira os campos: informe datas válidas, horas positivas e um nome para a tarefa.':'Não foi possível salvar. Tente novamente.'});
});
if(process.argv.includes('--production')) {
  app.use(express.static(resolve('dist')));app.get('/{*path}',(_req,res)=>res.sendFile(resolve('dist/index.html')));
} else {
  const {createServer}=await import('vite');const vite=await createServer({server:{middlewareMode:true},appType:'spa'});app.use(vite.middlewares);
}
const server=app.listen(port,'127.0.0.1',()=>console.log(`DCarvalho disponível em http://localhost:${port}`));
server.on('error',(e)=>{console.error(e.message);process.exit(1);});
for(const sig of ['SIGINT','SIGTERM'] as const) process.on(sig,()=>{server.close(()=>{store.db.close();process.exit(0);});});
