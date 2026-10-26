import { groupLabel, remaining, type Task } from './domain.js';
export type TaskSortKey='title'|'group'|'priority'|'status'|'due'|'estimate'|'actual'|'remaining';
export type SortDirection='asc'|'desc';
const collator=new Intl.Collator('pt-BR',{sensitivity:'base',numeric:true});
export function sortTasks(tasks:Task[],key:TaskSortKey,direction:SortDirection) {
  const number=(task:Task)=>key==='remaining'?remaining(task):key==='priority'?({Baixa:0,Média:1,Alta:2}[task.priority]):task[key as 'estimate'|'actual'];
  const text=(task:Task)=>key==='group'?groupLabel(task):task[key as 'title'|'status'|'due']||'';
  return [...tasks].sort((a,b)=>{
    // Missing dates and estimates stay last in both directions.
    if(key==='due'&&(!a.due||!b.due))return a.due?-1:b.due?1:0;
    if((key==='estimate'||key==='remaining')&&(!a.estimate||!b.estimate))return a.estimate?-1:b.estimate?1:0;
    const result=['priority','estimate','actual','remaining'].includes(key)?number(a)-number(b):collator.compare(text(a),text(b));
    return direction==='asc'?result:-result;
  });
}
