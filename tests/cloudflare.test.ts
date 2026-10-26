import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import worker from '../cloudflare/worker';
import { digest, passwordHash } from '../cloudflare/auth';
import { readWorkspace, saveWorkspace, mutateWorkspace } from '../cloudflare/workspace';
import type { Database, Env, Statement } from '../cloudflare/types';
import { addDays, today } from '../shared/domain';
function database() {
  const sql=new DatabaseSync(':memory:');for(const file of readdirSync('cloudflare/migrations').filter(f=>f.endsWith('.sql')).sort())sql.exec(readFileSync(`cloudflare/migrations/${file}`,'utf8'));
  const db:Database={prepare(query:string):Statement {
    let values:any[]=[];const statement=()=>sql.prepare(query);
    return {bind(...args:unknown[]){values=args;return this;},async first<T>(){return (statement().get(...values)||null) as T|null;},async all<T>(){return {results:statement().all(...values) as T[]};},async run(){return {meta:{changes:Number(statement().run(...values).changes)}};}};
  },async batch(statements:Statement[]){sql.exec('BEGIN');try{const results=[];for(const s of statements)results.push(await s.run());sql.exec('COMMIT');return results;}catch(e){sql.exec('ROLLBACK');throw e;}}};
  return {db,sql};
}
test('nuvem protege dados, cria uma senha única, persiste minutos e preserva lixeira e histórico',async()=>{
  const {db,sql}=database(),setupToken='test-setup-token',env:Env={DB:db,ASSETS:{fetch:async()=>new Response('app')},SETUP_TOKEN_HASH:await digest(setupToken),SETUP_EXPIRES_AT:String(Date.now()+60000)};
  let cookie='';
  async function request(path:string,method='GET',body?:object,expected=200,headers:Record<string,string>={}) {
    const r=await worker.fetch(new Request(`https://app.test/api${path}`,{method,headers:{...(cookie?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json',Origin:'https://app.test'}:{}),...headers},...(body?{body:JSON.stringify(body)}:{})}),env);
    assert.equal(r.status,expected,`${method} ${path}: ${await r.clone().text()}`);return r;
  }
  for(const path of ['/state','/backup','/notion'])await request(path,'GET',undefined,401);
  await request('/tasks','POST',{},401);
  assert.equal((await (await request('/auth/session')).json()).initialized,false);
  await request('/auth/setup','POST',{token:'wrong',password:'a-test-password-123'},403);
  const first=await request('/auth/setup','POST',{token:setupToken,password:'a-test-password-123'});
  const setCookie=first.headers.get('Set-Cookie')!;assert.match(setCookie,/HttpOnly; Secure; SameSite=Strict/);cookie=setCookie.split(';')[0];
  await request('/auth/setup','POST',{token:setupToken,password:'a-different-password'},409);
  assert.equal((await (await request('/auth/session')).json()).authenticated,true);
  let state=(await (await request('/state')).json());
  async function mutate(path:string,body:object={},method='POST',expected=200) {
    state=await (await request('/state')).json();const r=await request(path,method,{...body,revision:state.revision},expected);return r.json();
  }
  state=await mutate('/tasks',{title:'Estudo de 15 minutos',client:'',scope:'academic',project:'BI',estimate:.25,due:'2026-11-04',status:'A fazer',priority:'Média',notes:''});const task=state.tasks[0];
  await mutate('/blocks',{taskId:task.id,date:'2026-11-02',hours:.5});await mutate('/time',{taskId:task.id,date:'2026-11-02',hours:.25});
  await mutate('/availability',{date:'2026-11-02',hours:1},'PUT');
  await mutate('/reports',{key:'2026-11-02|academic:BI',done:'Entregas',next:'Estudos',comments:'Teste'},'PUT');
  const backup=await (await request('/backup')).json();assert.equal(backup.state.tasks[0].actual,.25);
  await mutate(`/tasks/${task.id}`,{},'DELETE');const archived=await (await request('/backup')).json();assert.equal(archived.trash[0].blocks.length,1);
  state=await mutate(`/tasks/${task.id}/restore`);assert.equal(state.tasks[0].actual,.25);assert.equal(state.blocks[0].hours,.5);
  await request('/availability','PUT',{date:'2026-11-02',hours:3,revision:0},409);
  await request('/availability','PUT',{date:'2026-11-02',hours:3,revision:state.revision},403,{Origin:'https://other.test'});
  const one=await readWorkspace(db),two=await readWorkspace(db),revision=one.state.revision;
  one.state.availability['2026-11-03']=2;await saveWorkspace(db,one,revision);
  two.state.availability['2026-11-03']=4;await assert.rejects(saveWorkspace(db,two,revision),/outra aba/);
  assert.equal((await readWorkspace(db)).state.availability['2026-11-03'],2);
  const yesterday=addDays(today(),-1);
  state=await mutate('/daily-reviews',{date:yesterday,entries:[{taskId:task.id,status:'Concluída',hours:.5}]});
  assert.equal(state.tasks[0].status,'Concluída');assert.equal(state.tasks[0].actual,.75);
  assert.equal(state.tasks[0].completedAt.slice(0,10),yesterday);assert.equal(state.dailyReviews[0].date,yesterday);
  const reviewed=JSON.stringify((await readWorkspace(db)).state);
  await mutate('/daily-reviews',{date:yesterday,entries:[]},'POST',409);
  assert.equal(JSON.stringify((await readWorkspace(db)).state),reviewed);
  await request('/auth/logout','POST',{});await request('/state','GET',undefined,401);
  await request('/auth/login','POST',{password:'wrong'},401);
  const login=await request('/auth/login','POST',{password:'a-test-password-123'});cookie=login.headers.get('Set-Cookie')!.split(';')[0];
  await request('/state');sql.prepare('UPDATE sessions SET expires_at=0').run();await request('/state','GET',undefined,401);
  for(let i=0;i<10;i++)await request('/auth/login','POST',{password:'wrong'},401);
  await request('/auth/login','POST',{password:'wrong'},429);
  assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM owner').get()!.n,1);sql.close();
});
test('senhas usam salt e PBKDF2, sem texto original persistido',async()=>{
  const a=await passwordHash('password-example-123','salt-one'),b=await passwordHash('password-example-123','salt-two');
  assert.notEqual(a,b);assert.equal(a,await passwordHash('password-example-123','salt-one'));assert.equal(a.length,64);
});

test('visitante consulta dados fictícios sem alterar ou acessar o planejamento pessoal',async()=>{
  const {db,sql}=database(),env:Env={DB:db,ASSETS:{fetch:async()=>new Response('app')}};
  const ownerPassword='owner-only-test-password',viewerPassword='viewer-only-test-password';
  sql.prepare('INSERT INTO owner VALUES(1,?,?,?)').run(await passwordHash(ownerPassword,'owner-salt'),'owner-salt',Date.now());
  sql.prepare("INSERT INTO viewer_access VALUES(1,?,?,?,'demo')").run(await passwordHash(viewerPassword,'viewer-salt'),'viewer-salt',Date.now());
  const privateDoc=await readWorkspace(db);
  mutateWorkspace(privateDoc,'/tasks','POST',{title:'PRIVATE TASK MUST NEVER LEAK',scope:'client',client:'Private client',project:'',estimate:3,status:'A fazer',priority:'Alta',due:null,notes:'Private notes'});
  await saveWorkspace(db,privateDoc,privateDoc.state.revision);
  const before=sql.prepare('SELECT data,revision FROM workspace').get(),ownerBefore=sql.prepare('SELECT * FROM owner').get();
  async function request(path:string,method='GET',body?:object,cookie='',expected=200) {
    const r=await worker.fetch(new Request(`https://app.test/api${path}`,{method,headers:{Cookie:cookie,...(body?{'Content-Type':'application/json',Origin:'https://app.test'}:{})},...(body?{body:JSON.stringify(body)}:{})}),env);
    assert.equal(r.status,expected,`${method} ${path}: ${await r.clone().text()}`);return r;
  }
  const ownerLogin=await request('/auth/login','POST',{password:ownerPassword}),ownerCookie=ownerLogin.headers.get('Set-Cookie')!.split(';')[0];
  await request('/view/state','GET',undefined,'',401);
  await request('/view/auth/login','POST',{password:ownerPassword},'',401);
  const viewerLogin=await request('/view/auth/login','POST',{password:viewerPassword,role:'owner'}),viewerCookie=viewerLogin.headers.get('Set-Cookie')!.split(';')[0];
  assert.match(viewerCookie,/^__Host-dcarvalho-viewer=/);assert.match(viewerLogin.headers.get('Set-Cookie')!,/Max-Age=86400/);
  const session=await (await request('/view/auth/session','GET',undefined,viewerCookie)).json();
  // Legacy hosted versions query sessions without a role: viewer tokens cannot match.
  const tokenHash=await digest(viewerCookie.split('=')[1]);
  assert.equal(sql.prepare('SELECT token_hash FROM sessions WHERE token_hash=?').get(tokenHash),undefined);
  assert.ok(sql.prepare('SELECT token_hash FROM viewer_sessions WHERE token_hash=?').get(tokenHash));
  assert.equal(session.role,'viewer');assert.equal(session.dataset,'demo');assert.equal(session.authenticated,true);
  const demo=await (await request('/view/state','GET',undefined,viewerCookie)).json();
  assert.ok(demo.tasks.length>0);assert.ok(demo.blocks.length>0);assert.ok(demo.timeEntries.length>0);
  assert.ok(demo.tasks.every((t:any)=>t.id.startsWith('demo-task-')&&!t.notionId&&!t.notionUrl));
  assert.ok(!JSON.stringify(demo).includes('PRIVATE'));assert.ok(!JSON.stringify(demo).includes('Private client'));
  assert.deepEqual((await (await request('/view/notion','GET',undefined,viewerCookie)).json()),{configured:false,mode:'read-only',source:null});
  await request('/view/backup','GET',undefined,viewerCookie,403);
  const allCookies=ownerCookie+'; '+viewerCookie;
  for(const [path,method] of [['/daily-reviews','POST'],['/tasks','POST'],['/tasks/private','PUT'],['/tasks/private','DELETE'],['/tasks/private/restore','POST'],['/blocks','POST'],['/blocks/private','PUT'],['/blocks/private','DELETE'],['/time','POST'],['/time/private','DELETE'],['/availability','PUT'],['/reports','PUT'],['/notion/sync','POST'],['/notion/resolve/private','POST'],['/examples','POST'],['/examples','DELETE']]) {
    await request('/view'+path,method,{revision:demo.revision},allCookies,403);
  }
  await request('/view/auth/setup','POST',{token:'anything',password:viewerPassword},viewerCookie,403);
  await request('/auth/login','POST',{password:viewerPassword},'',401);
  // Session roles are checked in the database, independent of the cookie name.
  const forged=viewerCookie.replace('__Host-dcarvalho-viewer=','__Host-dcarvalho=');
  for(const path of ['/state','/backup','/notion'])await request(path,'GET',undefined,forged,401);
  await request('/tasks','POST',{revision:0},forged,401);
  const ownState=await (await request('/state','GET',undefined,ownerCookie)).json();
  assert.equal(ownState.tasks[0].title,'PRIVATE TASK MUST NEVER LEAK');
  assert.deepEqual(sql.prepare('SELECT data,revision FROM workspace').get(),before);
  assert.deepEqual(sql.prepare('SELECT * FROM owner').get(),ownerBefore);
  await request('/view/auth/logout','POST',{},allCookies);
  await request('/view/state','GET',undefined,viewerCookie,401);
  await request('/state','GET',undefined,ownerCookie);
  assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM viewer_sessions').get()!.n,0);
  sql.close();
});

test('migração de visitante preserva sessões pessoais existentes',()=>{
  const sql=new DatabaseSync(':memory:');sql.exec(readFileSync('cloudflare/migrations/0001_workspace.sql','utf8'));
  sql.prepare('INSERT INTO sessions(token_hash,expires_at) VALUES(?,?)').run('existing-owner-session',Date.now()+60000);
  sql.exec(readFileSync('cloudflare/migrations/0002_viewer_access.sql','utf8'));
  assert.equal(sql.prepare('SELECT role FROM sessions').get()!.role,'owner');
  sql.prepare("INSERT INTO sessions(token_hash,expires_at,role) VALUES(?,?,'viewer')").run('legacy-viewer-session',Date.now()+60000);
  sql.exec(readFileSync('cloudflare/migrations/0003_isolated_viewer_sessions.sql','utf8'));
  assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM sessions').get()!.n,1);
  assert.equal(sql.prepare('SELECT token_hash FROM sessions').get()!.token_hash,'existing-owner-session');
  assert.equal(sql.prepare("SELECT name FROM sqlite_master WHERE name='viewer'").get(),undefined);
  sql.close();
});
