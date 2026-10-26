import { importNotion, notionStatus } from '../server/notion';
import { today } from '../shared/domain';
import { authenticated, authResponse } from './auth';
import { ApiError, mutateWorkspace, notionMemoryStore, readWorkspace, saveWorkspace, validRevision } from './workspace';
import type { Env } from './types';
const securityHeaders={
  'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY',
  'Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow',
  'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  'Strict-Transport-Security':'max-age=31536000'
};
function secured(response:Response) {const out=new Response(response.body,response);for(const [k,v] of Object.entries(securityHeaders))out.headers.set(k,v);return out;}
async function handle(request:Request,env:Env):Promise<Response> {
  const url=new URL(request.url),path=url.pathname.slice(4),api=url.pathname.startsWith('/api/');
  if(!api)return env.ASSETS.fetch(request);
  const db=env.DB.withSession?.('first-primary')||env.DB;
  if(path==='/health'&&request.method==='GET')return Response.json({ok:true});
  const writes=!['GET','HEAD'].includes(request.method);
  if(writes) {
    const origin=request.headers.get('Origin'),site=request.headers.get('Sec-Fetch-Site');
    if((origin&&origin!==url.origin)||(site&&site!=='same-origin'&&site!=='none'))throw new ApiError(403,'Origem não permitida.');
    if(!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json'))throw new ApiError(415,'Use JSON.');
    if(Number(request.headers.get('Content-Length')||0)>1048576)throw new ApiError(413,'Os dados excedem o limite permitido.');
  }
  let body:Record<string,unknown>={};
  if(writes) {
    const raw=await request.text();if(raw.length>1048576)throw new ApiError(413,'Os dados excedem o limite permitido.');
    try {body=JSON.parse(raw);if(!body||typeof body!=='object'||Array.isArray(body))throw Error();}catch{throw new ApiError(400,'JSON inválido.');}
  }
  if(path.startsWith('/auth/'))return authResponse(path,request,env,body,db);
  if(!await authenticated(request,db))throw new ApiError(401,'Sua sessão expirou. Entre novamente.');
  if(path==='/notion'&&request.method==='GET')return Response.json(notionStatus());
  const doc=await readWorkspace(db),revision=doc.state.revision;
  if(path==='/state'&&request.method==='GET')return Response.json(doc.state);
  if(path==='/backup'&&request.method==='GET')return Response.json({version:1,exportedAt:new Date().toISOString(),state:doc.state,trash:Object.values(doc.trash)},{headers:{'Content-Disposition':`attachment; filename="dcarvalho-${today()}.json"`}});
  if(path==='/notion/sync'&&request.method==='POST') {
    let result;
    try{result=await importNotion(notionMemoryStore(doc));}catch(e){throw new ApiError(400,e instanceof Error?e.message:'Falha ao ler o Notion.');}
    await saveWorkspace(db,doc,revision);return Response.json(result);
  }
  if(!writes)throw new ApiError(404,'Operação não encontrada.');
  if(!validRevision(body.revision)||body.revision!==revision)throw new ApiError(409,'Os dados mudaram em outra aba. A tela foi atualizada; tente novamente.');
  mutateWorkspace(doc,path,request.method,body);await saveWorkspace(db,doc,revision);return Response.json(doc.state);
}
export default {async fetch(request:Request,env:Env) {
  try{return secured(await handle(request,env));}
  catch(error) {
    const status=error instanceof ApiError?error.status:error instanceof Error&&error.name==='ZodError'?400:500;
    const message=error instanceof ApiError?error.message:status===400?'Confira os campos informados.':'Não foi possível concluir. Tente novamente.';
    return secured(Response.json({error:message},{status}));
  }
}};
