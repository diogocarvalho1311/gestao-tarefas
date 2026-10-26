import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hours, weekStart } from '../shared/domain.js';
import { academicEvents, monthDays, moveMonth } from '../shared/academic-calendar.js';
import { filterPickerTasks, type TaskPickerFilters } from '../shared/task-filters.js';
import { emptyState, exampleState } from '../server/store.js';
import { blockSchema, taskSchema } from '../server/validation.js';
test('minutos são preservados na persistência em horas e exibidos sem frações',()=>{
  assert.equal(hours(.25),'15min');assert.equal(hours(.5),'30min');assert.equal(hours(1),'1h');assert.equal(hours(1.25),'1h 15min');assert.equal(hours(1.5),'1h 30min');assert.equal(hours(5/60),'5min');
  assert.equal(blockSchema.parse({taskId:'x',date:'2026-10-26',hours:15/60}).hours,.25);
  assert.equal(taskSchema.safeParse({...exampleState().tasks[0],status:'Bloqueada'}).success,false);
});
test('busca de tarefas combina acentos, cliente, prazo, área e prioridade',()=>{
  const s=exampleState(),week=weekStart('2026-10-26');
  s.tasks[0].title='Revisão de anúncios';s.tasks[0].due=week;
  const f:TaskPickerFilters={query:'revisao',group:'client:Cliente Aurora',scope:'client',period:'week',from:'',to:'',priority:'Alta'};
  assert.deepEqual(filterPickerTasks(s.tasks,f,week).map(t=>t.id),[s.tasks[0].id]);
  assert.equal(filterPickerTasks(s.tasks,{...f,group:'client:Outro'},week).length,0);
  assert.equal(filterPickerTasks(s.tasks,{...f,period:'range',from:'2026-10-27'},week).length,0);
});
test('calendário acadêmico inclui apenas prazos e blocos de tarefas da faculdade',()=>{
  const s=emptyState(),base=exampleState().tasks[0];
  s.tasks=[{...base,id:'academic',scope:'academic',due:'2026-11-04'},{...base,id:'work',scope:'client',due:'2026-11-04'}];
  s.blocks=[{id:'study',taskId:'academic',date:'2026-11-02',hours:.5},{id:'work-block',taskId:'work',date:'2026-11-02',hours:2}];
  const events=academicEvents(s);assert.equal(events.length,2);assert.ok(events.every(e=>e.taskId==='academic'));assert.equal(events.find(e=>e.kind==='study')?.hours,.5);
  assert.equal(monthDays('2028-02').length,42);assert.ok(monthDays('2028-02').includes('2028-02-29'));assert.equal(moveMonth('2026-12',1),'2027-01');assert.equal(moveMonth('2027-01',-1),'2026-12');
});
