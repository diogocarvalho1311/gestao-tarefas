import { clientTheme } from '../../shared/client-theme';
import type { Task } from '../../shared/domain';
const clients=['Lucri','CWB Kids'] as const;
export default function ClientShortcuts({tasks,selected,onSelect}:{tasks:Task[];selected:string;onSelect:(client:string)=>void}) {
  return <>{clients.map(client=><button key={client} aria-label={`Tarefas da ${client}`} title={`Tarefas da ${client}`} aria-current={selected===client?'page':undefined} className={`nav-link client-shortcut client-${clientTheme(client)} ${selected===client?'selected':''}`} onClick={()=>onSelect(client)}><i className="client-nav-icon" aria-hidden="true"><i className={`group-dot client-${clientTheme(client)}`}/></i><span>{client}</span><small aria-label="Tarefas pendentes">{tasks.filter(t=>t.scope==='client'&&t.client===client&&t.status!=='Concluída').length}</small></button>)}</>;
}
