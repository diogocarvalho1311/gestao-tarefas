import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import worker from '../cloudflare/worker';
import { digest, passwordHash } from '../cloudflare/auth';
import { readWorkspace, saveWorkspace } from '../cloudflare/workspace';
import type { Database, Env, Statement } from '../cloudflare/types';
function database() {
  const sql=new DatabaseSync(':memory:');sql.exec(readFileSync('cloudflare/migrations/0001_workspace.sql','utf8'));
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
