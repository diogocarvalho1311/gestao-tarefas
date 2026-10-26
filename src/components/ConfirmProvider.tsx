import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, X } from 'lucide-react';
type Options={title?:string;accept?:string;destructive?:boolean};
type Ask=(message:string,options?:Options)=>Promise<boolean>;
const ConfirmContext=createContext<Ask>(async()=>false);
export const useConfirm=()=>useContext(ConfirmContext);
function ConfirmDialog({message,options,onResolve}:{message:string;options:Options;onResolve:(yes:boolean)=>void}) {
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const el=ref.current!;el.showModal();return()=>el.close();},[]);
  return <dialog ref={ref} className="modal confirm-dialog" onCancel={e=>{e.preventDefault();onResolve(false);}} aria-labelledby="confirmation-title" aria-describedby="confirmation-message"><div className="confirm-heading"><span className={`confirm-symbol ${options.destructive?'danger':''}`}><AlertTriangle size={22}/></span><button className="icon-button" aria-label="Fechar confirmação" onClick={()=>onResolve(false)}><X size={18}/></button></div><h2 id="confirmation-title">{options.title||'Confirmar ação'}</h2><p id="confirmation-message">{message}</p><div className="modal-actions"><button className="button" autoFocus onClick={()=>onResolve(false)}>Cancelar</button><button className={`button ${options.destructive?'destructive':'primary'}`} onClick={()=>onResolve(true)}>{options.accept||'Continuar'}</button></div></dialog>;
}
export function ConfirmProvider({children}:{children:ReactNode}) {
  const [pending,setPending]=useState<{message:string;options:Options;resolve:(v:boolean)=>void}|null>(null);
  const active=useRef(false);
  const ask:Ask=(message,options={})=>{
    if(active.current)return Promise.resolve(false);
    active.current=true;return new Promise(resolve=>setPending({message,options,resolve}));
  };
  const finish=(value:boolean)=>{pending?.resolve(value);active.current=false;setPending(null);};
  return <ConfirmContext.Provider value={ask}>{children}{pending&&<ConfirmDialog message={pending.message} options={pending.options} onResolve={finish}/>}</ConfirmContext.Provider>;
}
