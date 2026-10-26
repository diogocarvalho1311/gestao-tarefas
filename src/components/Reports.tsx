import { useEffect, useState } from 'react';
import { CalendarDays, Check, CheckCircle2, Copy, Download, FileText, ListTodo, LoaderCircle, Plus, RefreshCw, Search } from 'lucide-react';
import { groupLabel, hours, type Report, type State, type Task } from '../../shared/domain';
import { composeReport, defaultReportTitle, formattedReport, reportCandidates, reportHeadings, reportMetrics, reportPeriod } from '../../shared/reports';
import { clientTheme, taskDot } from '../../shared/client-theme';
import { downloadReportPdf } from '../lib/export-report';
import { useConfirm } from './ConfirmProvider';
import { useRuntime } from './SessionGate';

interface Props {onDirtyChange?:(dirty:boolean)=>void;state:State;week:string;selected:string;groups:[string,string][];busy:boolean;onSelect:(s:string)=>void;onSave:(r:Report)=>Promise<boolean>;onCopy:()=>void;onError:(s:string)=>void}
function TaskLinks({kind,tasks,suggested,ids,onChange}:{kind:'done'|'next';tasks:Task[];suggested:Task[];ids:string[];onChange:(ids:string[])=>void}) {
  const {readOnly}=useRuntime();
  const [expanded,setExpanded]=useState(false),[query,setQuery]=useState('');
  const eligible=tasks.filter(t=>kind==='done'?t.status==='Concluída':t.status!=='Concluída');
  const preview=tasks.filter(t=>ids.includes(t.id)||suggested.some(s=>s.id===t.id));
  const rows=expanded?eligible.filter(t=>`${t.title} ${groupLabel(t)}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())):preview;
  const toggle=(id:string)=>!readOnly&&onChange(ids.includes(id)?ids.filter(i=>i!==id):[...ids,id]);
  return <div className="report-task-links"><div className="task-links-heading"><span><ListTodo size={15}/>Tarefas vinculadas <b>{ids.length}</b></span><button className="text-button" onClick={()=>setExpanded(v=>!v)}><Plus size={14}/>{expanded?'Fechar seleção':readOnly?'Ver tarefas':'Adicionar / revisar'}</button></div>
    {expanded&&<label className="search report-task-search"><Search size={15}/><input aria-label={kind==='done'?'Buscar tarefas concluídas':'Buscar tarefas para planejar'} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar pelo nome da tarefa…"/></label>}
    <div className="report-linked-list">{rows.map(t=><label className="report-linked-task" key={t.id}><input type="checkbox" disabled={readOnly} checked={ids.includes(t.id)} onChange={()=>toggle(t.id)} aria-label={`${kind==='done'?'Incluir nos realizados':'Incluir no planejamento'}: ${t.title}`}/><span className="linked-task-body"><strong>{t.title}</strong><small><i className={`group-dot ${taskDot(t)}`}/>{groupLabel(t)}{kind==='done'&&!t.completedAt&&t.due&&<em>Data de referência do Notion · revisar</em>}</small></span></label>)}</div>
    {!rows.length&&<p className="report-links-empty">{expanded?'Nenhuma tarefa encontrada.':kind==='done'?'Sem conclusões identificadas neste período. Adicione uma tarefa concluída ou escreva no campo livre.':'Sem tarefas com blocos ou prazo na próxima semana. Você pode escolher outras tarefas.'}</p>}
    {!readOnly&&!expanded&&preview.length>0&&<p className="report-links-note">Desmarque o que não deve entrar no relatório.</p>}
  </div>;
}
export default function Reports({state,week,selected,groups,busy,onSelect,onSave,onCopy,onError,onDirtyChange}:Props) {
  const ask=useConfirm();
  const {hosted,readOnly}=useRuntime();
  const key=`${week}|${selected}`,label=groups.find(([id])=>id===selected)?.[1]||'Todos os trabalhos';
  const candidates=reportCandidates(state,week,selected),saved=state.reports.find(r=>r.key===key);
  const [draft,setDraft]=useState<Report>(()=>({key,title:defaultReportTitle(week,label),status:'Rascunho',done:'',next:'',comments:'',...saved,doneTaskIds:saved?.doneTaskIds??candidates.done.map(t=>t.id),nextTaskIds:saved?.nextTaskIds??candidates.next.map(t=>t.id),doneNotes:saved?.doneNotes??(saved?.doneTaskIds===undefined?saved?.done:'')??'',nextNotes:saved?.nextNotes??(saved?.nextTaskIds===undefined?saved?.next:'')??''}));
  const [dirty,setDirty]=useState(false),[exporting,setExporting]=useState(false);
  useEffect(()=>{onDirtyChange?.(dirty);return()=>onDirtyChange?.(false);},[dirty,onDirtyChange]);
  const composed=composeReport(draft,{...state,tasks:candidates.tasks}),metrics=reportMetrics(state,week,selected,draft),theme=selected.startsWith('client:')?clientTheme(label):'other';
  function change<K extends keyof Report>(field:K,value:Report[K]){if(readOnly)return;setDraft(d=>({...d,[field]:value}));setDirty(true);}
  function refresh(){setDraft(d=>({...d,doneTaskIds:candidates.done.map(t=>t.id),nextTaskIds:candidates.next.map(t=>t.id)}));setDirty(true);}
  async function copy(){try{await navigator.clipboard.writeText(`${formattedReport(composed,week,label)}\n\nTempo registrado no período: ${hours(metrics.workedHours)}\nTempo nas entregas selecionadas: ${hours(metrics.doneHours)}`);onCopy();}catch{onError('O navegador não permitiu copiar. Tente novamente.');}}
  async function exportPdf(){setExporting(true);try{await downloadReportPdf(composed,week,label,metrics);}catch{onError('Não foi possível gerar o PDF. Tente novamente.');}finally{setExporting(false);}}
  const referenceDates=candidates.done.some(t=>!t.completedAt&&!!t.due);
  return <div className={`reports-layout report-theme-${theme}`}><section className="panel report-panel">
    <div className="panel-heading"><div><h2>Seu relatório semanal</h2><p>Comece pelas tarefas. Complete com o contexto que importa.</p></div><span className="read-only">{readOnly?'Somente leitura':hosted?'Salvo na nuvem':'Salvo só aqui'}</span></div>
    <div className="report-filter"><label>Cliente ou projeto<select aria-label="Cliente ou projeto" value={selected} onChange={async e=>{const value=e.target.value;if(!dirty||await ask('Trocar o filtro e descartar as alterações não salvas?',{title:'Sair sem salvar?',accept:'Trocar sem salvar'}))onSelect(value);}}><option value="">Todos os trabalhos</option>{groups.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>{!readOnly&&<button className="button report-auto-button" onClick={refresh}><RefreshCw size={15}/>Puxar tarefas automaticamente</button>}</div>
    <div className="report-metadata"><label>Título do relatório<input aria-label="Título do relatório" value={draft.title||''} readOnly={readOnly} maxLength={250} onChange={e=>change('title',e.target.value)}/></label><div className="report-metadata-bottom"><span><CalendarDays size={14}/>{reportPeriod(week)}</span><label>Status<select disabled={readOnly} aria-label="Status do relatório" value={draft.status||'Rascunho'} onChange={e=>change('status',e.target.value as Report['status'])}><option>Rascunho</option><option>Enviado</option></select></label></div></div>
    <div className="report-metrics"><div><span>Entregas selecionadas</span><strong>{metrics.doneCount}</strong></div><div><span>Tempo registrado na semana</span><strong>{hours(metrics.workedHours)}</strong></div><div><span>Tempo nas entregas</span><strong>{hours(metrics.doneHours)}</strong></div><div><span>Planejado na próxima semana</span><strong>{hours(metrics.nextHours)}</strong></div></div>
    {referenceDates&&<p className="reference-date-note">Algumas tarefas importadas não têm data de conclusão. A seleção usa a Data do Notion como referência, sem criar uma data de conclusão. Revise as tarefas sinalizadas.</p>}
    <section className="report-section"><h3><CheckCircle2 size={18}/>{reportHeadings.done}</h3><TaskLinks kind="done" tasks={candidates.tasks} suggested={candidates.done} ids={draft.doneTaskIds||[]} onChange={ids=>change('doneTaskIds',ids)}/><label className="report-free-field">Complemento livre <span>Opcional · aparece depois das tarefas</span><textarea readOnly={readOnly} aria-label="Complemento dos realizados" rows={3} value={draft.doneNotes||''} onChange={e=>change('doneNotes',e.target.value)} placeholder="Conte os avanços ou acrescente algo que não virou tarefa." maxLength={30000}/></label></section>
    <section className="report-section"><h3><CalendarDays size={18}/>{reportHeadings.next}</h3><TaskLinks kind="next" tasks={candidates.tasks} suggested={candidates.next} ids={draft.nextTaskIds||[]} onChange={ids=>change('nextTaskIds',ids)}/><label className="report-free-field">Complemento livre <span>Opcional · aparece depois das tarefas</span><textarea readOnly={readOnly} aria-label="Complemento do planejamento" rows={3} value={draft.nextNotes||''} onChange={e=>change('nextNotes',e.target.value)} placeholder="Acrescente objetivos, intenções e próximos passos." maxLength={30000}/></label></section>
    <label className="report-field"><span><FileText size={17}/>Comentários</span><textarea readOnly={readOnly} aria-label="Comentários" rows={4} value={draft.comments} onChange={e=>change('comments',e.target.value)} placeholder="Contexto geral, resultados e pontos de atenção." maxLength={30000}/></label>
    <div className="report-actions"><span className="muted small-text">{dirty?'Alterações ainda não salvas':saved?hosted?'Rascunho salvo na nuvem':'Rascunho salvo neste computador':'Tarefas selecionadas automaticamente · revise antes de exportar'}</span><div>{!readOnly&&<button className="button" disabled={busy} onClick={async()=>{if(await onSave(composed))setDirty(false);}}>Salvar rascunho</button>}<button className="button" onClick={copy}><Copy size={15}/>Copiar</button><button className="button primary" disabled={exporting} onClick={exportPdf}>{exporting?<LoaderCircle size={15} className="spinning"/>:<Download size={15}/>}Exportar PDF</button></div></div>
  </section></div>;
}
