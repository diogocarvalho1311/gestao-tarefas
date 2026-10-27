import { useState } from 'react';
import { Eye, ArrowDown, ArrowUp, ArrowUpDown, CalendarClock, Check, LockKeyhole, Pencil, Trash2 } from 'lucide-react';
import { addDays, groupLabel, hours, priorities, remaining, statuses, today, type Task } from '../../shared/domain';
import { sortTasks, type SortDirection, type TaskSortKey } from '../../shared/task-sorting';
import { taskDot } from '../../shared/client-theme';

const columns:{key:TaskSortKey;label:string}[]=[{key:'status',label:'Status'},{key:'title',label:'Tarefa'},{key:'group',label:'Cliente / projeto / disciplina'},{key:'priority',label:'Prioridade'},{key:'due',label:'Prazo'},{key:'estimate',label:'Estimado'},{key:'actual',label:'Realizado'},{key:'remaining',label:'Restante'}];
interface Props {readOnly?:boolean;tasks:Task[];busy:boolean;onToggle:(t:Task)=>void;onEdit:(t:Task)=>void;onDelete:(t:Task)=>void}
export default function TasksTable({readOnly=false,tasks,busy,onToggle,onEdit,onDelete}:Props) {
  const [sort,setSort]=useState<{key:TaskSortKey;direction:SortDirection}|null>(null);
  // Stable sorting keeps the chosen column order within each fixed status group.
  const rows=sortTasks(sort?sortTasks(tasks,sort.key,sort.direction):tasks,'status','asc');
  function change(key:TaskSortKey){setSort(s=>({key,direction:s?.key===key&&s.direction==='asc'?'desc':'asc'}));}
  return <div className="table-scroll"><table><thead><tr>{columns.map(({key,label})=><th key={key} aria-sort={key==='status'?undefined:sort?.key===key?sort.direction==='asc'?'ascending':'descending':'none'}>{key==='status'?<span className="sort-heading" title="Ordem fixa: A fazer → Em andamento → Concluída">{label}<LockKeyhole size={12}/></span>:<button className="sort-heading" onClick={()=>change(key)} aria-label={`Ordenar por ${label}`} title="Ordena dentro de cada status. Clique para alternar crescente e decrescente.">{label}{sort?.key!==key?<ArrowUpDown size={12}/>:sort.direction==='asc'?<ArrowUp size={12}/>:<ArrowDown size={12}/>}</button>}</th>)}<th className="task-actions-column">Ações</th></tr></thead><tbody>{rows.map(t=>{
    const late=t.status!=='Concluída'&&!!t.due&&t.due<today(),near=t.status!=='Concluída'&&!!t.due&&t.due<=addDays(today(),2);
    return <tr key={t.id} className={t.status==='Concluída'?'completed':''}>
      <td><span className={`status status-${statuses.indexOf(t.status)}`}>{t.status}</span></td>
      <td><div className="table-name"><button disabled={busy||readOnly} className={`checkbox ${t.status==='Concluída'?'checked':''}`} onClick={()=>onToggle(t)} aria-label={`${t.status==='Concluída'?'Reabrir':'Concluir'} ${t.title}`}>{t.status==='Concluída'&&<Check size={13}/>}</button><button onClick={()=>onEdit(t)}>{t.title}{t.dirty&&<small className="warning">Alteração local{t.conflict?' · conflito no Notion':''}</small>}</button></div></td>
      <td><span className="group-cell"><i className={`group-dot ${taskDot(t)}`}/>{groupLabel(t)}</span></td>
      <td><span className={`priority ${['high','medium','low'][priorities.indexOf(t.priority)]}`}><i/>{t.priority}</span></td>
      <td>{t.due?<span className={`due ${late?'danger':near?'warning':''}`}><CalendarClock size={13}/>{new Date(`${t.due}T12:00:00Z`).toLocaleDateString('pt-BR',{day:'2-digit',month:'short',timeZone:'UTC'})}{late?' · atrasada':''}</span>:<span className="muted">Sem prazo</span>}</td>
      <td>{t.estimate?hours(t.estimate):<span className="muted">A estimar</span>}</td><td>{hours(t.actual)}</td><td>{t.estimate?hours(remaining(t)):'—'}</td>
      <td className="task-actions-column"><div className="table-actions"><button className="icon-button" aria-label={`${readOnly?'Ver detalhes de':'Editar'} ${t.title}`} onClick={()=>onEdit(t)}>{readOnly?<Eye size={15}/>:<Pencil size={14}/>}</button>{!readOnly&&<button className="icon-button delete-task" aria-label={`Excluir ${t.title}`} disabled={busy||readOnly} onClick={()=>onDelete(t)}><Trash2 size={15}/></button>}</div></td>
    </tr>;
  })}</tbody></table></div>;
}
