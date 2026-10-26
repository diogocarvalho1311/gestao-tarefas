import { addDays, allocated, groupKey, inWeek, type Report, type State, type Task } from './domain.js';
export const reportHeadings={done:'O que eu fiz de mais relevante na semana passada?',next:'O que está planejado de mais relevante para realizar essa semana?',comments:'Comentários'};
const day=(date:string)=>date.slice(8,10);
export function defaultReportTitle(week:string,label:string) {
  const end=addDays(week,6);
  const period=week.slice(0,7)===end.slice(0,7)?`${day(week)}-${day(end)}/${week.slice(5,7)}`:`${day(week)}/${week.slice(5,7)} - ${day(end)}/${end.slice(5,7)}`;
  return `${period} - ${label}`;
}
export const reportPeriod=(week:string)=>[week,addDays(week,6)].map(d=>new Date(`${d}T12:00:00Z`).toLocaleDateString('pt-BR',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'})).join(' → ');
export function reportCandidates(state:State,week:string,group:string) {
  const tasks=state.tasks.filter(t=>!group||groupKey(t)===group),nextWeek=addDays(week,7);
  return {
    done:tasks.filter(t=>t.status==='Concluída'&&(inWeek(t.completedAt,week)||(!t.completedAt&&inWeek(t.due,week)))),
    next:tasks.filter(t=>t.status!=='Concluída'&&(allocated(state,t.id,nextWeek)>0||inWeek(t.due,nextWeek))),
    tasks
  };
}
export function composeReport(report:Report,state:State):Report {
  const section=(ids:string[]|undefined,notes:string|undefined,legacy:string)=>ids===undefined?legacy:[...ids.map(id=>state.tasks.find(t=>t.id===id)).filter((t):t is Task=>!!t).map(t=>`• ${t.title}`),...(notes?.trim()?['',notes.trim()]:[])].join('\n');
  return {...report,done:section(report.doneTaskIds,report.doneNotes,report.done),next:section(report.nextTaskIds,report.nextNotes,report.next)};
}
export interface ReportMetrics {doneCount:number;workedHours:number;doneHours:number;nextHours:number}
export function reportMetrics(state:State,week:string,group:string,report:Report):ReportMetrics {
  const tasks=state.tasks.filter(t=>!group||groupKey(t)===group),ids=new Set(tasks.map(t=>t.id));
  const done=new Set(report.doneTaskIds??reportCandidates(state,week,group).done.map(t=>t.id));
  const entries=state.timeEntries.filter(e=>ids.has(e.taskId)&&inWeek(e.date,week));
  return {doneCount:tasks.filter(t=>done.has(t.id)&&t.status==='Concluída').length,workedHours:entries.reduce((s,e)=>s+e.hours,0),doneHours:entries.filter(e=>done.has(e.taskId)).reduce((s,e)=>s+e.hours,0),nextHours:state.blocks.filter(b=>ids.has(b.taskId)&&inWeek(b.date,addDays(week,7))).reduce((s,b)=>s+b.hours,0)};
}
export function formattedReport(report:Report,week:string,label:string) {
  return `${report.title||defaultReportTitle(week,label)}\nCliente / projeto: ${label}\nPeríodo: ${reportPeriod(week)}\nStatus: ${report.status||'Rascunho'}\n\n${reportHeadings.done}\n${report.done||'Nenhuma conclusão registrada.'}\n\n${reportHeadings.next}\n${report.next||'Nenhuma tarefa planejada.'}\n\n${reportHeadings.comments}\n${report.comments||'Sem observações.'}`;
}
