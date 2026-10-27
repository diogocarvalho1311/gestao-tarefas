import { test } from 'node:test';
import assert from 'node:assert/strict';
import { exampleState, openStore } from '../server/store.js';
import { applyDailyReview, completionDay, pendingReviewDate, pendingReviewDates, reviewTasks, taskHoursOn } from '../shared/daily-review.js';
import { dailyReviewSchema } from '../server/validation.js';
import { reportMetrics } from '../shared/reports.js';
import { addDays, today, weekStart } from '../shared/domain.js';

test('revisão atualiza várias tarefas e o total de ontem, preserva outros dias e persiste uma única vez',()=>{
  const current=today(),date=addDays(current,-1),s=exampleState(),a=s.tasks[0],b=s.tasks[1];
  a.notionId='read-only-notion';a.notionFields=['status'];a.dirty=false;
  s.timeEntries=[{id:'a-one',taskId:a.id,date,hours:.25},{id:'a-two',taskId:a.id,date,hours:.5},{id:'b-old',taskId:b.id,date:addDays(date,-1),hours:2}];
  const blocks=structuredClone(s.blocks),entries=[{taskId:a.id,status:'Concluída' as const,hours:.75},{taskId:b.id,status:'Em andamento' as const,hours:.5}];
  const store=openStore(':memory:');store.save(s);
  const result=applyDailyReview(store.read(),{date,entries});store.save(result);
  const after=store.read();
  assert.equal(after.tasks[0].status,'Concluída');assert.equal(completionDay(after.tasks[0].completedAt),date);assert.equal(after.tasks[0].dirty,true);
  assert.equal(after.tasks[1].status,'Em andamento');assert.equal(after.tasks[1].completedAt,null);assert.equal(after.tasks[1].actual,2.5);
  assert.equal(taskHoursOn(after,a.id,date),.75);assert.equal(after.timeEntries.filter(e=>e.taskId===a.id&&e.date===date).length,2);
  assert.ok(after.timeEntries.some(e=>e.id==='b-old'));assert.deepEqual(after.blocks,blocks);
  assert.equal(pendingReviewDate(after,current),null);assert.equal(pendingReviewDate(after,addDays(current,1)),current);
  const before=structuredClone(after);assert.throws(()=>applyDailyReview(after,{date,entries}),/já foi salva/);assert.deepEqual(after,before);
  assert.equal(reportMetrics(after,weekStart(date),'',{key:'test',done:'',next:'',comments:'',doneTaskIds:[a.id]}).workedHours,after.timeEntries.filter(e=>e.date>=weekStart(date)&&e.date<=addDays(weekStart(date),6)).reduce((n,e)=>n+e.hours,0));
  store.db.close();
});

test('revisão inválida não aplica mudanças parciais, nem reabre conclusões de dias posteriores',()=>{
  const s=exampleState(),date=addDays(today(),-1),a=s.tasks[0],b=s.tasks[1],before=structuredClone(s);
  assert.throws(()=>applyDailyReview(s,{date,entries:[{taskId:a.id,status:'Concluída',hours:1},{taskId:'missing',status:'Em andamento',hours:2}]}),/não está mais disponível/);assert.deepEqual(s,before);
  assert.throws(()=>applyDailyReview(s,{date,entries:[{taskId:a.id,status:'Concluída',hours:13},{taskId:b.id,status:'Em andamento',hours:13}]}),/24 horas/);assert.deepEqual(s,before);
  assert.throws(()=>applyDailyReview(s,{date:today(),entries:[]}),/dias anteriores/);
  assert.equal(dailyReviewSchema.safeParse({date:'2026-02-30',entries:[]}).success,false);
  for(const hours of [-1,Infinity,25])assert.equal(dailyReviewSchema.safeParse({date,entries:[{taskId:a.id,status:'Em andamento',hours}]}).success,false);
  assert.throws(()=>applyDailyReview(s,{date,entries:[{taskId:a.id,status:'Concluída',hours:1},{taskId:a.id,status:'Em andamento',hours:1}]}),/apenas uma vez/);
  a.status='Concluída';a.completedAt=`${today()}T12:00:00-03:00`;
  applyDailyReview(s,{date,entries:[{taskId:a.id,status:'Em andamento',hours:.25}]});
  assert.equal(a.status,'Concluída');assert.equal(completionDay(a.completedAt),today());assert.equal(taskHoursOn(s,a.id,date),.25);
});

test('datas da revisão seguem São Paulo e tarefas fora do planejamento também podem ser selecionadas',()=>{
  assert.equal(completionDay('2026-10-26T01:00:00Z'),'2026-10-25');
  const s=exampleState(),date='2026-10-25';s.blocks=[{id:'planned',taskId:s.tasks[1].id,date,hours:2}];
  s.tasks[0].status='Concluída';s.tasks[0].completedAt='2026-10-26T01:00:00Z';
  const candidates=reviewTasks(s,date);assert.equal(candidates[0].id,s.tasks[1].id);assert.ok(candidates.some(t=>t.id===s.tasks[0].id));assert.ok(candidates.some(t=>t.id===s.tasks[2].id));
  const reviewDate=pendingReviewDate(s,'2026-10-26');assert.equal(reviewDate,date);
  const taskBefore=structuredClone(s.tasks);applyDailyReview(s,{date,entries:[]},'2026-10-26');assert.deepEqual(s.tasks,taskBefore);assert.equal(pendingReviewDate(s,'2026-10-26'),null);
});

test('dias sem resposta continuam pendentes e responder fora de ordem preserva atualizações mais recentes',()=>{
  const s=exampleState(),current='2026-10-26',task=s.tasks[0];
  s.dailyReviewStartDate='2026-10-20';s.dailyReviews=[{date:'2026-10-21',reviewedAt:'2026-10-22T12:00:00Z',entries:[]}];s.timeEntries=[];
  assert.deepEqual(pendingReviewDates(s,current),['2026-10-20','2026-10-22','2026-10-23','2026-10-24','2026-10-25']);
  applyDailyReview(s,{date:'2026-10-24',entries:[{taskId:task.id,status:'Em andamento',hours:.5}]},current);
  applyDailyReview(s,{date:'2026-10-22',entries:[{taskId:task.id,status:'Concluída',hours:1}]},current);
  assert.equal(task.status,'Em andamento');assert.equal(task.completedAt,null);assert.equal(task.actual,1.5);
  assert.equal(taskHoursOn(s,task.id,'2026-10-22'),1);assert.equal(taskHoursOn(s,task.id,'2026-10-24'),.5);
  assert.deepEqual(pendingReviewDates(s,current),['2026-10-20','2026-10-23','2026-10-25']);
  assert.deepEqual(pendingReviewDates(s,'2026-10-28'),['2026-10-20','2026-10-23','2026-10-25','2026-10-26','2026-10-27']);
});
