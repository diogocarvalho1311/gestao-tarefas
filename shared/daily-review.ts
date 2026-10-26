import { addDays, today, type DailyReviewEntry, type State } from './domain.js';

export class DailyReviewError extends Error { constructor(public status:400|404|409,message:string){super(message);} }
export const taskHoursOn=(state:State,taskId:string,date:string)=>state.timeEntries.filter(e=>e.taskId===taskId&&e.date===date).reduce((sum,e)=>sum+e.hours,0);
export function completionDay(value:string|null) {
  if(!value)return null;
  const date=new Date(value);if(!Number.isFinite(date.getTime()))return null;
  return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
}
export function reviewTasks(state:State,date:string) {
  const scheduled=new Set(state.blocks.filter(b=>b.date===date).map(b=>b.taskId)),worked=new Set(state.timeEntries.filter(e=>e.date===date).map(e=>e.taskId));
  return state.tasks.filter(t=>t.status!=='Concluída'||completionDay(t.completedAt)===date||scheduled.has(t.id)||worked.has(t.id))
    .sort((a,b)=>Number(scheduled.has(b.id)||worked.has(b.id))-Number(scheduled.has(a.id)||worked.has(a.id))||a.title.localeCompare(b.title,'pt-BR'));
}
export const pendingReviewDate=(state:State,currentDay=today())=>{
  const yesterday=addDays(currentDay,-1);
  return state.tasks.length&&!(state.dailyReviews||[]).some(r=>r.date===yesterday)?yesterday:null;
};
// Both backends validate and apply the complete review before their single save.
export function applyDailyReview(state:State,input:{date:string;entries:DailyReviewEntry[]},currentDay=today()) {
  const {date,entries}=input;
  if(date>=currentDay)throw new DailyReviewError(400,'Revise apenas dias anteriores a hoje.');
  if((state.dailyReviews||[]).some(r=>r.date===date))throw new DailyReviewError(409,'A revisão deste dia já foi salva.');
  const ids=new Set(entries.map(e=>e.taskId));
  if(ids.size!==entries.length)throw new DailyReviewError(400,'Selecione cada tarefa apenas uma vez.');
  const checked=entries.map(entry=>{
    const task=state.tasks.find(t=>t.id===entry.taskId);
    if(!task)throw new DailyReviewError(404,'Uma das tarefas não está mais disponível. Atualize a revisão.');
    return {entry,task};
  });
  const dayTotal=state.timeEntries.filter(e=>e.date===date&&!ids.has(e.taskId)).reduce((sum,e)=>sum+e.hours,0)+entries.reduce((sum,e)=>sum+e.hours,0);
  if(dayTotal>24+1e-8)throw new DailyReviewError(400,'O tempo total registrado nesse dia não pode ultrapassar 24 horas.');
  for(const {entry,task} of checked) {
    // A retrospective must not reopen something already finished on a later day.
    if(!(task.status==='Concluída'&&task.completedAt&&(completionDay(task.completedAt)||'')>date)) {
      if(task.status!==entry.status&&task.notionId&&(task.notionFields||['status']).includes('status'))task.dirty=true;
      task.status=entry.status;
      task.completedAt=entry.status==='Concluída'?(task.completedAt||`${date}T12:00:00-03:00`):null;
    }
    const previous=taskHoursOn(state,task.id,date);
    if(Math.abs(previous-entry.hours)>1e-8) {
      state.timeEntries=state.timeEntries.filter(e=>e.taskId!==task.id||e.date!==date);
      if(entry.hours>0)state.timeEntries.push({id:crypto.randomUUID(),taskId:task.id,date,hours:entry.hours});
    }
    task.actual=state.timeEntries.filter(e=>e.taskId===task.id).reduce((sum,e)=>sum+e.hours,0);
  }
  state.dailyReviews=[...(state.dailyReviews||[]),{date,reviewedAt:new Date().toISOString(),entries:entries.map(e=>({...e}))}];
  return state;
}
