import { useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, CalendarClock, Check, Pencil, Trash2 } from 'lucide-react';
import { addDays, groupLabel, hours, priorities, remaining, statuses, today, type Task } from '../../shared/domain';
import { sortTasks, type SortDirection, type TaskSortKey } from '../../shared/task-sorting';
import { taskDot } from '../../shared/client-theme';

const columns:{key:TaskSortKey;label:string}[]=[{key:'title',label:'Tarefa'},{key:'group',label:'Cliente / projeto / disciplina'},{key:'priority',label:'Prioridade'},{key:'status',label:'Status'},{key:'due',label:'Prazo'},{key:'estimate',label:'Estimado'},{key:'actual',label:'Realizado'},{key:'remaining',label:'Restante'}];
interface Props {tasks:Task[];busy:boolean;onToggle:(t:Task)=>void;onEdit:(t:Task)=>void;onDelete:(t:Task)=>void}
export default function TasksTable({tasks,busy,onToggle,onEdit,onDelete}:Props) {
  const [sort,setSort]=useState<{key:TaskSortKey;direction:SortDirection}|null>(null);
  const rows=sort?sortTasks(tasks,sort.key,sort.direction):tasks;
  function change(key:TaskSortKey){setSort(s=>({key,direction:s?.key===key&&s.direction==='asc'?'desc':'asc'}));}
  return <div className="table-scroll"><table><thead><tr>{columns.map(({key,label})=><th key={key} aria-sort={sort?.key===key?sort.direction==='asc'?'ascending':'descending':'none'}><button className="sort-heading" onClick={()=>change(key)} aria-label={`Ordenar por ${label}`} title="Clique para alternar crescente e decrescente">{label}{sort?.key!==key?<ArrowUpDown size={12}/>:sort.direction==='asc'?<ArrowUp size={12}/>:<ArrowDown size={12}/>}</button></th>)}<th>Ações</th></tr></thead><tbody>{rows.map(t=>{
    const late=t.status!=='Concluída'&&!!t.due&&t.due<today(),near=t.status!=='Concluída'&&!!t.due&&t.due<=addDays(today(),2);
    return <tr key={t.id} className={t.status==='Concluída'?'completed':''}>
      <td><div className="table-name"><button disabled={busy} className={`checkbox ${t.status==='Concluída'?'checked':''}`} onClick={()=>onToggle(t)} aria-label={`${t.status==='Concluída'?'Reabrir':'Concluir'} ${t.title}`}>{t.status==='Concluída'&&<Check size={13}/>}</button><button onClick={()=>onEdit(t)}>{t.title}{t.dirty&&<small className="warning">Alteração local{t.conflict?' · conflito no Notion':''}</small>}</button></div></td>
      <td><span className="group-cell"><i className={`group-dot ${taskDot(t)}`}/>{groupLabel(t)}</span></td>
      <td><span className={`priority ${['high','medium','low'][priorities.indexOf(t.priority)]}`}><i/>{t.priority}</span></td>
      <td><span className={`status status-${statuses.indexOf(t.status)}`}>{t.status}</span></td>
      <td>{t.due?<span className={`due ${late?'danger':near?'warning':''}`}><CalendarClock size={13}/>{new Date(`${t.due}T12:00:00Z`).toLocaleDateString('pt-BR',{day:'2-digit',month:'short',timeZone:'UTC'})}{late?' · atrasada':''}</span>:<span className="muted">Sem prazo</span>}</td>
      <td>{t.estimate?hours(t.estimate):<span className="muted">A estimar</span>}</td><td>{hours(t.actual)}</td><td>{t.estimate?hours(remaining(t)):'—'}</td>
      <td><div className="table-actions"><button className="icon-button" aria-label={`Editar ${t.title}`} onClick={()=>onEdit(t)}><Pencil size={14}/></button><button className="icon-button delete-task" aria-label={`Excluir ${t.title}`} disabled={busy} onClick={()=>onDelete(t)}><Trash2 size={15}/></button></div></td>
    </tr>;
  })}</tbody></table></div>;
}
