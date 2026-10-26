import { addDays, groupKey, groupLabel, inWeek, matchesScope, today, weekStart, type Task } from './domain.js';
export interface TaskPickerFilters {query:string;group:string;scope:string;period:string;from:string;to:string;priority:string}
const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
export function filterPickerTasks(tasks:Task[],filters:TaskPickerFilters,executionDate:string) {
  const week=weekStart(executionDate);
  return tasks.filter(t=>{
    if(!matchesScope(t,filters.scope))return false;
    if(filters.group&&groupKey(t)!==filters.group)return false;
    if(filters.priority&&t.priority!==filters.priority)return false;
    if(filters.query&&!normalize(`${t.title} ${groupLabel(t)}`).includes(normalize(filters.query)))return false;
    switch(filters.period) {
      case 'week':return inWeek(t.due,week);
      case 'next':return inWeek(t.due,addDays(week,7));
      case 'late':return !!t.due&&t.due<today();
      case 'none':return !t.due;
      case 'range':return !!t.due&&(!filters.from||t.due>=filters.from)&&(!filters.to||t.due<=filters.to);
      default:return true;
    }
  });
}
