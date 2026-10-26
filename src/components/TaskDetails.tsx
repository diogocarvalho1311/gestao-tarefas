import { CalendarDays, Clock3 } from 'lucide-react';
import { groupLabel, hours, remaining, type State, type Task } from '../../shared/domain';
import { taskDot } from '../../shared/client-theme';
const date=(value:string)=>new Date(`${value}T12:00:00Z`).toLocaleDateString('pt-BR',{timeZone:'UTC'});
export default function TaskDetails({task,state}:{task:Task;state:State}) {
  const blocks=state.blocks.filter(b=>b.taskId===task.id).sort((a,b)=>a.date.localeCompare(b.date));
  return <div className="task-details"><p className="task-details-group"><i className={`group-dot ${taskDot(task)}`}/>{groupLabel(task)}</p><h3>{task.title}</h3><dl><div><dt>Status</dt><dd>{task.status}</dd></div><div><dt>Prioridade</dt><dd>{task.priority}</dd></div><div><dt>Prazo</dt><dd>{task.due?date(task.due):'Sem prazo'}</dd></div><div><dt>Estimado</dt><dd>{task.estimate?hours(task.estimate):'A estimar'}</dd></div><div><dt>Realizado</dt><dd>{hours(task.actual)}</dd></div><div><dt>Restante</dt><dd>{task.estimate?hours(remaining(task)):'A estimar'}</dd></div></dl>{task.notes&&<section><h4>Observações</h4><p>{task.notes}</p></section>}<section><h4><CalendarDays size={15}/>Blocos planejados</h4>{blocks.length?blocks.map(b=><p key={b.id}>{date(b.date)} · {hours(b.hours)}</p>):<p>Nenhum bloco reservado.</p>}</section><section><h4><Clock3 size={15}/>Tempo registrado</h4>{state.timeEntries.filter(e=>e.taskId===task.id).map(e=><p key={e.id}>{date(e.date)} · {hours(e.hours)}</p>)}{!state.timeEntries.some(e=>e.taskId===task.id)&&<p>Nenhum registro de tempo.</p>}</section></div>;
}
