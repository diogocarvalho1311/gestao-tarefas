import { useState } from 'react';
import { Check, Search, SlidersHorizontal } from 'lucide-react';
import { groupKey, groupLabel, priorities, type Task } from '../../shared/domain';
import { taskDot } from '../../shared/client-theme';
import { filterPickerTasks, type TaskPickerFilters } from '../../shared/task-filters';
const emptyFilters:TaskPickerFilters={query:'',group:'',scope:'all',period:'all',from:'',to:'',priority:''};
export default function TaskPicker({tasks,value,onChange,date,locked=false}:{tasks:Task[];value:string;onChange:(id:string)=>void;date:string;locked?:boolean}) {
  const [filters,setFilters]=useState(emptyFilters),[showFilters,setShowFilters]=useState(false);
  const eligible=tasks.filter(t=>t.status!=='Concluída'||t.id===value),selected=tasks.find(t=>t.id===value);
  const groups=[...new Map(eligible.map(t=>[groupKey(t),groupLabel(t)])).entries()].sort((a,b)=>a[1].localeCompare(b[1]));
  const rows=filterPickerTasks(eligible,filters,date).sort((a,b)=>a.title.localeCompare(b.title,'pt-BR'));
  const change=(key:keyof TaskPickerFilters,value:string)=>setFilters(f=>({...f,[key]:value}));
  return <div className="task-picker"><div className="task-picker-title"><span>Tarefa</span>{!locked&&<button type="button" className={`text-button ${showFilters?'active':''}`} onClick={()=>setShowFilters(v=>!v)}><SlidersHorizontal size={14}/>Filtros</button>}</div>
    {selected&&<div className="selected-task"><i className={`group-dot ${taskDot(selected)}`}/><div><strong>{selected.title}</strong><span>{groupLabel(selected)}</span></div><Check size={15}/></div>}
    {!locked&&<><label className="search task-picker-search"><Search size={16}/><input type="search" aria-label="Pesquisar tarefas para reservar tempo" value={filters.query} onChange={e=>change('query',e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();if(rows.length===1)onChange(rows[0].id);}}} placeholder="Pesquisar pelo nome, cliente ou projeto…"/></label>
      <div className="task-picker-primary-filters"><select aria-label="Cliente ou projeto da tarefa" value={filters.group} onChange={e=>change('group',e.target.value)}><option value="">Todos os clientes / projetos</option>{groups.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select><select aria-label="Período do prazo da tarefa" value={filters.period} onChange={e=>change('period',e.target.value)}><option value="all">Qualquer prazo</option><option value="week">Prazo nesta semana</option><option value="next">Prazo na próxima semana</option><option value="late">Atrasadas</option><option value="none">Sem prazo</option><option value="range">Escolher período</option></select></div>
      {showFilters&&<div className="task-picker-primary-filters"><select aria-label="Área da tarefa" value={filters.scope} onChange={e=>change('scope',e.target.value)}><option value="all">Todas as áreas</option><option value="client">Clientes</option><option value="projects">Meus projetos</option><option value="personal">Minhas tarefas</option><option value="academic">Faculdade</option></select><select aria-label="Prioridade da tarefa" value={filters.priority} onChange={e=>change('priority',e.target.value)}><option value="">Todas as prioridades</option>{priorities.map(p=><option key={p}>{p}</option>)}</select></div>}
      {filters.period==='range'&&<div className="task-picker-primary-filters"><label>De<input type="date" aria-label="Início do prazo" value={filters.from} onChange={e=>change('from',e.target.value)}/></label><label>Até<input type="date" aria-label="Fim do prazo" value={filters.to} min={filters.from||undefined} onChange={e=>change('to',e.target.value)}/></label></div>}
      <div className="task-picker-results" aria-label="Resultados da pesquisa de tarefas">{rows.map(t=><button type="button" key={t.id} className={`task-picker-option ${t.id===value?'selected':''}`} aria-pressed={t.id===value} onClick={()=>onChange(t.id)}><i className={`group-dot ${taskDot(t)}`}/><span><strong>{t.title}</strong><small>{groupLabel(t)} · {t.due?`Prazo: ${new Date(`${t.due}T12:00:00Z`).toLocaleDateString('pt-BR',{timeZone:'UTC'})}`:'Sem prazo'}</small></span>{t.id===value&&<Check size={15}/>}</button>)}{!rows.length&&<p>Nenhuma tarefa encontrada com estes filtros.</p>}</div>
      <div className="task-picker-footer"><span>{rows.length} tarefa{rows.length!==1?'s':''} encontrada{rows.length!==1?'s':''}</span><button type="button" className="text-button" onClick={()=>setFilters(emptyFilters)}>Limpar filtros</button></div>
    </>}
  </div>;
}
