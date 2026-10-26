import { z } from 'zod';
import { taskSchema, blockSchema, availabilitySchema, reportSchema, dailyReviewSchema } from '../server/validation';
import { applyDailyReview, DailyReviewError } from '../shared/daily-review';
import type { State, Task, Block } from '../shared/domain';
import type { NotionStore } from '../server/notion';
import type { Database } from './types';
export interface ArchivedTask {task:Task;blocks:Block[];timeEntries:Block[];removedAt:string}
export interface Workspace {state:State;trash:Record<string,ArchivedTask>;baselines:Record<string,string>}
export class ApiError extends Error {constructor(public status:number,message:string){super(message);}}
export async function readWorkspace(db:Database):Promise<Workspace> {
  const row=await db.prepare('SELECT data FROM workspace WHERE id=1').first<{data:string}>();
  if(!row)throw new ApiError(503,'O banco ainda não foi preparado.');
  return JSON.parse(row.data);
}
export async function saveWorkspace(db:Database,doc:Workspace,expected:number) {
  doc.state.revision=expected+1;
  const result=await db.prepare('UPDATE workspace SET data=?,revision=? WHERE id=1 AND revision=?').bind(JSON.stringify(doc),doc.state.revision,expected).run();
  if(!result.meta.changes)throw new ApiError(409,'Os dados mudaram em outra aba. A tela foi atualizada; tente novamente.');
}
export function notionMemoryStore(doc:Workspace):NotionStore {
  return {read:()=>doc.state,save:state=>{state.revision++;doc.state=state;return state;},baseline:id=>doc.baselines[id],setBaseline:(id,value)=>{doc.baselines[id]=value;},isRemovedNotion:id=>Object.values(doc.trash).some(t=>t.task.notionId===id),db:{exec:()=>{}}};
}
export function mutateWorkspace(doc:Workspace,path:string,method:string,body:Record<string,unknown>) {
  const s=doc.state,parts=path.split('/').filter(Boolean),id=parts[1],task=s.tasks.find(t=>t.id===id);
  if(path==='/examples')throw new ApiError(400,'Os exemplos estão disponíveis na versão local.');
  if(path==='/tasks'&&method==='POST') {
    const input=taskSchema.parse(body);
    s.tasks.push({id:crypto.randomUUID(),...input,completedAt:input.status==='Concluída'?new Date().toISOString():null,notionId:null,notionUrl:null,dirty:false,example:false,actual:0});
  } else if(parts[0]==='tasks'&&parts.length===2&&method==='PUT') {
    if(!task)throw new ApiError(404,'Tarefa não encontrada.');
    const input=taskSchema.parse(body),changed=(task.notionFields||['title','client','due','priority','status']).some(k=>(input as Record<string,unknown>)[k]!==(task as unknown as Record<string,unknown>)[k]);
    Object.assign(task,input,{completedAt:input.status==='Concluída'?(task.completedAt||new Date().toISOString()):null,dirty:task.dirty||!!(task.notionId&&changed)});
  } else if(parts[0]==='tasks'&&parts.length===2&&method==='DELETE') {
    if(!task)throw new ApiError(404,'Tarefa não encontrada.');
    doc.trash[id]={task,blocks:s.blocks.filter(b=>b.taskId===id),timeEntries:s.timeEntries.filter(e=>e.taskId===id),removedAt:new Date().toISOString()};
    s.tasks=s.tasks.filter(t=>t.id!==id);s.blocks=s.blocks.filter(b=>b.taskId!==id);s.timeEntries=s.timeEntries.filter(e=>e.taskId!==id);
  } else if(parts[0]==='tasks'&&parts[2]==='restore'&&parts.length===3&&method==='POST') {
    const archived=doc.trash[id];if(!archived)throw new ApiError(404,'Tarefa não encontrada na lixeira.');
    s.tasks.push(archived.task);s.blocks.push(...archived.blocks);s.timeEntries.push(...archived.timeEntries);delete doc.trash[id];
  } else if(path==='/availability'&&method==='PUT') {
    const input=availabilitySchema.parse(body);s.availability[input.date]=input.hours;
  } else if(parts[0]==='blocks'&&parts.length<=2) {
    if(method==='DELETE'&&id)s.blocks=s.blocks.filter(b=>b.id!==id);
    else if(method==='POST'&&!id) {
      const input=blockSchema.parse(body),t=s.tasks.find(t=>t.id===input.taskId);
      if(!t||t.status==='Concluída')throw new ApiError(400,'Selecione uma tarefa pendente.');
      s.blocks.push({id:crypto.randomUUID(),...input});
    } else if(method==='PUT'&&id) {
      const input=blockSchema.parse(body),block=s.blocks.find(b=>b.id===id);
      if(!block||input.taskId!==block.taskId)throw new ApiError(404,'Bloco não encontrado.');
      Object.assign(block,input);
    } else throw new ApiError(404,'Operação não encontrada.');
  } else if(parts[0]==='time'&&parts.length<=2) {
    if(method==='POST'&&!id) {
      const input=blockSchema.parse(body),t=s.tasks.find(t=>t.id===input.taskId);
      if(!t)throw new ApiError(404,'Tarefa não encontrada.');
      s.timeEntries.push({id:crypto.randomUUID(),...input});t.actual=s.timeEntries.filter(e=>e.taskId===t.id).reduce((sum,e)=>sum+e.hours,0);
    } else if(method==='DELETE'&&id) {
      const entry=s.timeEntries.find(e=>e.id===id),t=s.tasks.find(t=>t.id===entry?.taskId);
      s.timeEntries=s.timeEntries.filter(e=>e.id!==id);
      if(t)t.actual=s.timeEntries.filter(e=>e.taskId===t.id).reduce((sum,e)=>sum+e.hours,0);
    } else throw new ApiError(404,'Operação não encontrada.');
  } else if(path==='/daily-reviews'&&method==='POST') {
    try{applyDailyReview(s,dailyReviewSchema.parse(body));}catch(e){if(e instanceof DailyReviewError)throw new ApiError(e.status,e.message);throw e;}
  } else if(path==='/reports'&&method==='PUT') {
    const input=reportSchema.parse(body);s.reports=s.reports.filter(r=>r.key!==input.key);s.reports.push(input);
  } else if(parts[0]==='notion'&&parts[1]==='resolve'&&parts.length===3&&method==='POST') {
    const t=s.tasks.find(t=>t.id===parts[2]);if(!t?.notionId)throw new ApiError(404,'Tarefa não encontrada.');t.dirty=false;t.conflict=false;
  } else throw new ApiError(404,'Operação não encontrada.');
  return s;
}
export const validRevision=(value:unknown):value is number=>z.number().int().nonnegative().safeParse(value).success;
