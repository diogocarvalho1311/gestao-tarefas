import { addDays, weekStart, type State } from './domain.js';
export interface AcademicEvent {id:string;taskId:string;date:string;kind:'deadline'|'study';hours?:number}
export function academicEvents(state:State):AcademicEvent[] {
  const tasks=state.tasks.filter(t=>t.scope==='academic'),ids=new Set(tasks.map(t=>t.id));
  return [...tasks.filter(t=>t.due).map(t=>({id:`due:${t.id}`,taskId:t.id,date:t.due!,kind:'deadline' as const})),...state.blocks.filter(b=>ids.has(b.taskId)).map(b=>({id:b.id,taskId:b.taskId,date:b.date,kind:'study' as const,hours:b.hours}))];
}
export const monthDays=(month:string)=>{const start=weekStart(`${month}-01`);return Array.from({length:42},(_,i)=>addDays(start,i));};
export function moveMonth(month:string,offset:number) {const date=new Date(`${month}-01T12:00:00Z`);date.setUTCMonth(date.getUTCMonth()+offset);return date.toISOString().slice(0,7);}
