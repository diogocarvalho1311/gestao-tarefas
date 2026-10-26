export type Status = 'A fazer' | 'Em andamento' | 'Concluída';
export type Priority = 'Alta' | 'Média' | 'Baixa';
export interface Task {
  id: string; title: string; client: string; scope: 'client' | 'personal' | 'academic'; project: string; priority: Priority; status: Status;
  due: string | null; estimate: number; notes: string; completedAt: string | null;
  notionId: string | null; notionUrl: string | null; dirty: boolean; example: boolean;
  actual: number; conflict?: boolean; notionFields?: string[]; personalType?: 'project' | 'task';
}
export interface Block { id: string; taskId: string; date: string; hours: number }
export interface TimeEntry { id: string; taskId: string; date: string; hours: number }
export interface Report { key: string; done: string; next: string; comments: string; title?: string; status?: 'Rascunho' | 'Enviado'; doneTaskIds?: string[]; nextTaskIds?: string[]; doneNotes?: string; nextNotes?: string }
export interface State { tasks: Task[]; blocks: Block[]; timeEntries: TimeEntry[]; availability: Record<string,number>; reports: Report[]; revision: number }
export const priorities: Priority[] = ['Alta','Média','Baixa'];
export const statuses: Status[] = ['A fazer','Em andamento','Concluída'];
export function today() { return new Intl.DateTimeFormat('en-CA', { timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit' }).format(new Date()); }
export function addDays(date: string, n: number) { const d = new Date(`${date}T12:00:00Z`); d.setUTCDate(d.getUTCDate()+n); return d.toISOString().slice(0,10); }
export function weekStart(date = today()) { const day = new Date(`${date}T12:00:00Z`).getUTCDay(); return addDays(date, -(day === 0 ? 6 : day-1)); }
export const weekDays = (week: string) => Array.from({length:7},(_,i)=>addDays(week,i));
export const inWeek = (date: string | null, week: string) => !!date && date.slice(0,10)>=week && date.slice(0,10)<=addDays(week,6);
export const defaultCapacity = (date: string) => { const day=new Date(`${date}T12:00:00Z`).getUTCDay(); return day===0||day===6?0:6; };
export const capacity = (state: State, date: string) => state.availability[date] ?? defaultCapacity(date);
export const remaining = (task: Task) => Math.max(0, task.estimate-task.actual);
export const allocated = (state: State, taskId: string, week?: string) => state.blocks.filter(b=>b.taskId===taskId&&(!week||inWeek(b.date,week))).reduce((s,b)=>s+b.hours,0);
export function summary(state: State, week: string) {
  const blocks=state.blocks.filter(b=>inWeek(b.date,week));
  const available=weekDays(week).reduce((s,d)=>s+capacity(state,d),0);
  const planned=blocks.reduce((s,b)=>s+b.hours,0);
  const ids=new Set(blocks.map(b=>b.taskId));
  return {available, planned, balance:available-planned, count:ids.size, done:state.tasks.filter(t=>ids.has(t.id)&&t.status==='Concluída').length, occupancy:available?planned/available*100:planned?100:0};
}
export const isPersonalProject=(task:Task)=>task.scope==='personal'&&(task.personalType==='project'||(!task.personalType&&!!task.project.trim()));
export const matchesScope=(task:Task,scope:string)=>scope==='all'||(scope==='projects'?isPersonalProject(task):scope==='personal'?task.scope==='personal'&&!isPersonalProject(task):task.scope===scope);
export const groupLabel = (task: Task) => task.scope==='academic' ? task.project || 'Faculdade' : task.scope==='personal' ? isPersonalProject(task)?task.project || 'Meus projetos':'Minhas tarefas' : task.client || 'Sem cliente';
export const groupKey = (task: Task) => task.scope==='client' ? `client:${task.client}` : `${task.scope}:${task.project}`;
export function reportText(state: State, week: string, group: string) {
  const tasks=state.tasks.filter(t=>!group||groupKey(t)===group);
  const done=tasks.filter(t=>inWeek(t.completedAt,week)).map(t=>`• ${t.title}`).join('\n');
  const nextWeek=addDays(week,7);
  const next=tasks.filter(t=>t.status!=='Concluída'&&(allocated(state,t.id,nextWeek)>0||inWeek(t.due,nextWeek))).map(t=>`• ${t.title}`).join('\n');
  return { done, next, comments:'' };
}
export const hours = (n:number) => {
  const minutes=Math.round(Math.abs(n)*60),h=Math.floor(minutes/60),m=minutes%60,sign=n<0?'-':'';
  return `${sign}${h?`${h}h${m?` ${m}min`:''}`:`${m}min`}`;
};
