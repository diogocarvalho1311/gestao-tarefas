import { test } from 'node:test';
import assert from 'node:assert/strict';
import { exampleState, openStore } from '../server/store.js';
import { matchesScope, type Task } from '../shared/domain.js';
import { sortTasks } from '../shared/task-sorting.js';
import { clientTheme, taskDot } from '../shared/client-theme.js';
test('ordenação textual, numérica e por data, com valores ausentes no final',()=>{
  const base=exampleState().tasks[0];
  const tasks:Task[]=[{...base,id:'a',title:'Zebra 10',estimate:10,due:'2026-11-01'},{...base,id:'b',title:'Álbum 2',estimate:2,due:'2026-10-26'},{...base,id:'c',title:'Zebra 2',estimate:0,due:null}];
  assert.deepEqual(sortTasks(tasks,'title','asc').map(t=>t.id),['b','c','a']);
  assert.deepEqual(sortTasks(tasks,'estimate','asc').map(t=>t.id),['b','a','c']);
  assert.deepEqual(sortTasks(tasks,'estimate','desc').map(t=>t.id),['a','b','c']);
  assert.deepEqual(sortTasks(tasks,'due','desc').map(t=>t.id),['a','b','c']);
  assert.deepEqual(tasks.map(t=>t.id),['a','b','c']);
});
test('projetos e tarefas pessoais são categorias distintas sem perder compatibilidade',()=>{
  const base=exampleState().tasks[3];
  assert.equal(matchesScope(base,'projects'),true);assert.equal(matchesScope(base,'personal'),false);
  assert.equal(matchesScope({...base,personalType:'task',project:''},'personal'),true);
  assert.equal(matchesScope({...base,personalType:'project'},'projects'),true);
  assert.equal(clientTheme('CWB Kids'),'cwb');assert.equal(clientTheme(' Lucri '),'lucri');assert.equal(taskDot({...base,scope:'client',client:'CWB Kids'}),'client-cwb');
});
test('exclusão local é reversível, arquiva o histórico e impede reimportação automática',()=>{
  const store=openStore(':memory:'),s=exampleState(),task=s.tasks[0];task.notionId='notion-removed';store.save(s);
  const original=store.read();const removed=store.removeTask(task.id)!;
  assert.ok(!removed.tasks.some(t=>t.id===task.id));assert.ok(!removed.blocks.some(b=>b.taskId===task.id));assert.equal(store.isRemovedNotion('notion-removed'),true);
  assert.equal(store.trash()[0].blocks.length,original.blocks.filter(b=>b.taskId===task.id).length);
  const restored=store.restoreTask(task.id)!;
  assert.equal(restored.tasks.find(t=>t.id===task.id)?.notionId,'notion-removed');assert.equal(restored.blocks.length,original.blocks.length);assert.equal(store.isRemovedNotion('notion-removed'),false);store.db.close();
});
