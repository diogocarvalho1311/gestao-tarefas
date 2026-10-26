import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyState, exampleState, openStore } from '../server/store.js';
import { addDays, weekStart, summary, remaining, allocated, reportText, groupKey, today } from '../shared/domain.js';
import { taskSchema, dateSchema, blockSchema } from '../server/validation.js';
test('a semana inicia na segunda, inclusive ao atravessar ano e domingo',()=>{
  assert.equal(weekStart('2026-11-01'),'2026-10-26');assert.equal(addDays('2026-12-31',1),'2027-01-01');assert.equal(weekStart('2027-01-01'),'2026-12-28');
});
test('uma tarefa se divide em dias sem duplicação e tarefas sem bloco não consomem horas',()=>{
  const s=exampleState(),w=weekStart();s.blocks=[{id:'a',taskId:s.tasks[0].id,date:w,hours:2},{id:'b',taskId:s.tasks[0].id,date:addDays(w,1),hours:3}];
  assert.equal(allocated(s,s.tasks[0].id,w),5);assert.deepEqual(summary(s,w),{available:30,planned:5,balance:25,count:1,done:0,occupancy:5/30*100});
  assert.equal(summary(s,addDays(w,7)).planned,0);
});
test('capacidade zero, fim de semana editável e excesso produzem valores finitos',()=>{
  const s=emptyState(),w=weekStart();for(let i=0;i<7;i++)s.availability[addDays(w,i)]=0;
  assert.equal(summary(s,w).occupancy,0);s.blocks=[{id:'a',taskId:'x',date:w,hours:7}];
  assert.equal(summary(s,w).balance,-7);assert.equal(summary(s,w).occupancy,100);s.availability[addDays(w,5)]=4;assert.equal(summary(s,w).available,4);
});
test('tempo restante não fica negativo e concluir preserva blocos históricos',()=>{
  const s=exampleState(),t=s.tasks[0],before=JSON.stringify(s.blocks);t.actual=100;t.status='Concluída';
  assert.equal(remaining(t),0);assert.equal(JSON.stringify(s.blocks),before);
});
test('relatórios usam conclusão, blocos da próxima semana e prazo sem misturar clientes e projetos',()=>{
  const s=exampleState(),w=weekStart(),a=s.tasks[0],b=s.tasks[1],p=s.tasks[3];
  a.completedAt=`${w}T12:00:00Z`;a.status='Concluída';a.due=addDays(w,30);
  b.due=addDays(w,8);p.completedAt=`${w}T12:00:00Z`;p.status='Concluída';
  assert.match(reportText(s,w,groupKey(a)).done,new RegExp(a.title));assert.ok(!reportText(s,w,groupKey(a)).done.includes(p.title));assert.ok(reportText(s,w,groupKey(p)).done.includes(p.title));
  assert.ok(reportText(s,w,groupKey(b)).next.includes(b.title));
  b.due=null;s.blocks.push({id:'next',taskId:b.id,date:addDays(w,7),hours:1});assert.ok(reportText(s,w,groupKey(b)).next.includes(b.title));
});
test('validação rejeita horas negativas, infinitas e datas impossíveis',()=>{
  assert.equal(dateSchema.safeParse('2026-02-30').success,false);assert.equal(dateSchema.safeParse('2028-02-29').success,true);
  for(const hours of [-1,0,Infinity,25])assert.equal(blockSchema.safeParse({taskId:'a',date:today(),hours}).success,false);
  assert.equal(taskSchema.safeParse({...exampleState().tasks[0],title:'  '}).success,false);
});
test('SQLite salva e relê todos os dados em uma gravação atômica',()=>{
  const store=openStore(':memory:'),s=exampleState();store.save(s);assert.deepEqual(store.read(),s);store.db.close();
});
