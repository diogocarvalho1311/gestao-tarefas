import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { once } from 'node:events';
import { today, weekStart, addDays } from '../shared/domain.js';
const temp=mkdtempSync(join(tmpdir(),'compasso-test-')),base='http://127.0.0.1:3197';
let server:ChildProcess;
async function start() {
  server=spawn(process.execPath,[resolve('node_modules/tsx/dist/cli.mjs'),'server/index.ts','--production'],{env:{...process.env,PORT:'3197',DATABASE_PATH:join(temp,'test.sqlite'),NOTION_TOKEN:''},stdio:['ignore','pipe','pipe']});
  for(let i=0;i<150;i++) {try{if((await fetch(`${base}/api/health`)).ok)return;}catch{}await new Promise(r=>setTimeout(r,100));}
  throw new Error('Servidor de teste não iniciou.');
}
async function stop() {if(server&&!server.killed){server.kill();await once(server,'exit');}}
async function get(){return (await fetch(`${base}/api/state`)).json();}
async function action(path:string,body:object={},method='POST',expected=200) {
  const current=await get();const r=await fetch(`${base}/api${path}`,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:current.revision,...body})});assert.equal(r.status,expected,`${method} ${path}`);return r.json();
}
try {
  await start();assert.equal((await get()).tasks.length,0);
  let s=await action('/tasks',{title:'Tarefa de teste',client:'',scope:'personal',project:'Meu projeto',priority:'Alta',status:'A fazer',due:addDays(weekStart(),4),estimate:5,notes:''});const task=s.tasks[0],w=weekStart();
  await action('/blocks',{taskId:task.id,date:w,hours:2});await action('/blocks',{taskId:task.id,date:addDays(w,1),hours:3});
  await action('/availability',{date:w,hours:1},'PUT');await action('/time',{taskId:task.id,date:today(),hours:6});
  s=await action(`/tasks/${task.id}`,{...task,status:'Concluída'},'PUT');assert.equal(s.blocks.length,2);assert.equal(s.tasks[0].actual,6);assert.ok(s.tasks[0].completedAt);
  await action('/blocks',{taskId:task.id,date:w,hours:-1},'POST',400);
  await action('/tasks',{...task,title:'inválida',revision:-1},'POST',409);
  const block=s.blocks[0];await action(`/blocks/${block.id}`,{...block,date:addDays(w,7)},'PUT');
  s=await action('/reports',{key:`${w}|personal:Meu projeto`,done:'Concluí a tarefa.',next:'Planejar próximos passos.',comments:'Teste de persistência.'},'PUT');
  const backup=await (await fetch(`${base}/api/backup`)).json();assert.equal(backup.state.reports[0].comments,'Teste de persistência.');
  await action(`/tasks/${task.id}`,{},'DELETE');
  assert.equal((await get()).tasks.length,0);
  const archived=await (await fetch(`${base}/api/backup`)).json();assert.equal(archived.trash[0].task.id,task.id);assert.equal(archived.trash[0].timeEntries.length,1);
  await stop();await start();assert.equal((await get()).tasks.length,0);
  s=await action(`/tasks/${task.id}/restore`);assert.equal(s.blocks.length,2);assert.equal(s.tasks[0].actual,6);
  await stop();await start();const after=await get();assert.deepEqual(after,s);
  const cross=await fetch(`${base}/api/tasks`,{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://external.test'},body:'{}'});assert.equal(cross.status,403);
  console.log('Smoke OK: tarefas, planejamento, relatórios, backup, exclusão local e restauração com histórico após reinício.');
} finally {await stop();rmSync(temp,{recursive:true,force:true});}
