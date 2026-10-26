import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole, LoaderCircle } from 'lucide-react';
const RuntimeContext=createContext<{hosted:boolean;readOnly:boolean;demo:boolean;logout?:()=>Promise<void>}>({hosted:false,readOnly:false,demo:false});
export const useRuntime=()=>useContext(RuntimeContext);
const viewerPath=()=>/^\/visualizacao(?:\/|$)/.test(location.pathname);
const authPath=()=>viewerPath()?'/api/view/auth':'/api/auth';
export async function apiFetch(input:RequestInfo|URL,init?:RequestInit) {
  if(viewerPath()&&typeof input==='string'&&input.startsWith('/api/')&&!input.startsWith('/api/view/'))input=input.replace('/api/','/api/view/');
  const response=await fetch(input,init);
  if(response.status===401)window.dispatchEvent(new Event('dcarvalho-session-expired'));
  return response;
}
type Session={mode:'local'|'cloud';authenticated:boolean;initialized:boolean;role?:'owner'|'viewer'|null;dataset?:'demo'|null};
export default function SessionGate({children}:{children:ReactNode}) {
  const [session,setSession]=useState<Session|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[shown,setShown]=useState(false),[once,setOnce]=useState(false);
  const [setupToken]=useState(()=>{const token=new URLSearchParams(location.hash.slice(1)).get('setup')||'';if(token)history.replaceState(null,'',location.pathname+location.search);return token;});
  const refresh=async()=>{const r=await fetch(authPath()+'/session');if(!r.ok)throw Error('Não foi possível abrir seu espaço. Tente novamente.');const s:Session=await r.json();setSession(s);if(s.authenticated)setOnce(true);};
  useEffect(()=>{refresh().catch(e=>setError(e.message));const expired=()=>{document.querySelectorAll<HTMLDialogElement>('dialog[open]').forEach(d=>d.close());setSession(s=>s?{...s,authenticated:false}:s);setError('Sua sessão expirou. Entre novamente para continuar.');};window.addEventListener('dcarvalho-session-expired',expired);return()=>window.removeEventListener('dcarvalho-session-expired',expired);},[]);
  async function logout() {const r=await fetch(authPath()+'/logout',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});if(r.ok){setOnce(false);await refresh();}}
  const visitor=viewerPath(),setup=session&&!session.initialized&&!visitor,allowed=!!session?.authenticated;
  useEffect(()=>{if(allowed)document.querySelectorAll<HTMLDialogElement>('dialog:not([open])').forEach(d=>d.showModal());},[allowed]);
  async function submit(e:React.FormEvent<HTMLFormElement>) {
    e.preventDefault();const form=new FormData(e.currentTarget),password=String(form.get('password'));
    if(setup&&password!==form.get('confirmation')){setError('As senhas precisam ser iguais.');return;}
    setBusy(true);setError('');
    try {
      const r=await fetch(authPath()+(setup?'/setup':'/login'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password,...(setup?{token:setupToken}:{})})});
      if(!r.ok){const result=await r.json();throw Error(result.error||'Não foi possível entrar.');}
      await refresh();
    }catch(e){setError(e instanceof Error?e.message:'Confira sua conexão e tente novamente.');}finally{setBusy(false);}
  }
  return <RuntimeContext.Provider value={{hosted:session?.mode==='cloud',readOnly:session?.role==='viewer',demo:session?.dataset==='demo',logout:session?.mode==='cloud'?logout:undefined}}>
    {once&&<div hidden={!allowed}>{children}</div>}
    {!allowed&&<main className="login-screen"><div className="login-wordmark">DCarvalho</div><section className="login-card"><span className="login-symbol">{visitor?<Eye size={24}/>:<LockKeyhole size={24}/>}</span><p className="eyebrow">{visitor?'ACESSO DE VISITANTE':'UM ESPAÇO SÓ SEU'}</p><h1>{visitor?'Conheça o DCarvalho.':setup?'Crie sua senha.':'Seu tempo começa aqui.'}</h1><p className="login-description">{!session?'Abrindo seu espaço…':visitor?'Explore tarefas, planejamento e relatórios em modo de visualização.':setup?'Proteja seu planejamento com uma senha que só você conhece.':'Entre para cuidar das suas tarefas, projetos e próximos passos.'}</p>
      {error&&<p className="login-error" role="alert">{error}</p>}
      {!session?error?<button className="button" onClick={()=>location.reload()}>Tentar novamente</button>:<LoaderCircle className="spinning" size={22}/>:setup&&!setupToken?<div className="login-activation">Abra o link de primeiro acesso para criar sua senha. Se você já criou uma, atualize esta página.</div>:<form onSubmit={submit}>
        {visitor&&<p className="viewer-username">Usuário: <strong>visitante</strong></p>}
        <label>{visitor?'Senha de visualização':'Sua senha'}<div className="login-password"><input name="password" aria-label={visitor?'Senha de visualização':'Sua senha'} type={shown?'text':'password'} autoComplete={setup?'new-password':'current-password'} minLength={setup?12:undefined} maxLength={256} required autoFocus/><button type="button" className="icon-button" aria-label={shown?'Ocultar senha':'Mostrar senha'} onClick={()=>setShown(v=>!v)}>{shown?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>
        {setup&&<><p className="login-hint">Use pelo menos 12 caracteres.</p><label>Repita sua senha<input name="confirmation" aria-label="Repita sua senha" type={shown?'text':'password'} autoComplete="new-password" minLength={12} maxLength={256} required/></label></>}
        <button className="button primary" disabled={busy} type="submit">{busy?<><LoaderCircle size={17} className="spinning"/>Aguarde…</>:<>{visitor?'Entrar na visualização':setup?'Criar senha e entrar':'Entrar no meu espaço'}<ArrowRight size={17}/></>}</button>
      </form>}
      <p className="login-footnote">{visitor?session?.dataset==='demo'?'Demonstração com dados fictícios · somente leitura':'Somente leitura': 'Seu planejamento, só para você.'}</p><a className="text-button login-view-link" href={visitor?'/':'/visualizacao'}>{visitor?'Acesso pessoal':'Entrar como visitante'}</a></section><footer>Menos pressa. Mais direção.</footer></main>}
  </RuntimeContext.Provider>;
}
