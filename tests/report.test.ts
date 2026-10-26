import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formattedReport, defaultReportTitle, composeReport, reportCandidates, reportMetrics } from '../shared/reports.js';
import { buildReportPdf } from '../src/lib/export-report.js';
import { emptyState, exampleState } from '../server/store.js';
import { addDays, groupKey, weekStart } from '../shared/domain.js';
test('relatório mantém o texto editado, as três seções e a identificação do período',async()=>{
  const report={key:'test',title:'19-25/10 - Lucri',status:'Enviado' as const,done:'• Revisar anúncios',next:'• Modelar novos produtos',comments:'Texto revisado manualmente. Ação e organização.'};
  const text=formattedReport(report,'2026-10-19','Lucri');
  assert.match(text,/19-25\/10 - Lucri/);assert.match(text,/Texto revisado manualmente/);assert.match(text,/Status: Enviado/);
  const pdf=await buildReportPdf(report,'2026-10-19','Lucri');
  assert.equal(Buffer.from(pdf.bytes).subarray(0,4).toString(),'%PDF');assert.ok(pdf.filename.endsWith('.pdf'));assert.ok(!pdf.filename.includes('/'));
});
test('tarefas automáticas e complementos livres são separados, e métricas usam tempo da semana',()=>{
  const s=exampleState(),week=weekStart(),t=s.tasks[0];t.status='Concluída';t.completedAt=null;t.due=week;
  s.timeEntries=[{id:'old',taskId:t.id,date:addDays(week,-7),hours:9},{id:'now',taskId:t.id,date:week,hours:2}];
  const candidates=reportCandidates(s,week,groupKey(t));assert.ok(candidates.done.some(x=>x.id===t.id));assert.equal(t.completedAt,null);
  const draft={key:'test',done:'',next:'',comments:'',doneTaskIds:[t.id],nextTaskIds:[],doneNotes:'Contexto adicional.'};
  const composed=composeReport(draft,s);assert.match(composed.done,new RegExp(t.title));assert.match(composed.done,/Contexto adicional/);
  const metrics=reportMetrics(s,week,groupKey(t),draft);assert.equal(metrics.workedHours,2);assert.equal(metrics.doneHours,2);assert.equal(metrics.doneCount,1);
  assert.equal(composeReport({...draft,doneTaskIds:[]},s).done,'\nContexto adicional.');
});
test('PDF suporta relatórios longos e títulos que atravessam dois meses',async()=>{
  assert.equal(defaultReportTitle('2026-10-26','CWB Kids'),'26/10 - 01/11 - CWB Kids');
  const pdf=await buildReportPdf({key:'long',done:'• Tarefa concluída\n'.repeat(180),next:'Próximas ações',comments:'Comentário final.'},'2026-10-19','Faculdade');
  assert.ok(pdf.bytes.byteLength>3000);
});
