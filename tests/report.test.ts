import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formattedReport, defaultReportTitle, initialReportTitle, composeReport, reportCandidates, reportMetrics } from '../shared/reports.js';
import { buildReportPdf } from '../src/lib/export-report.js';
import { emptyState, exampleState } from '../server/store.js';
import { addDays, groupKey } from '../shared/domain.js';
test('relatório mantém o texto editado, as três seções e a identificação do período',async()=>{
  const report={key:'test',title:'19-25/10 - Lucri',status:'Enviado' as const,done:'• Revisar anúncios',next:'• Modelar novos produtos',comments:'Texto revisado manualmente. Ação e organização.'};
  const text=formattedReport(report,'2026-10-19','Lucri');
  assert.match(text,/19-25\/10 - Lucri/);assert.match(text,/Texto revisado manualmente/);assert.match(text,/Status: Enviado/);
  const pdf=await buildReportPdf(report,'2026-10-19','Lucri');
  assert.equal(Buffer.from(pdf.bytes).subarray(0,4).toString(),'%PDF');assert.ok(pdf.filename.endsWith('.pdf'));assert.ok(!pdf.filename.includes('/'));
});
test('tarefas automáticas e complementos livres são separados, e métricas usam tempo da semana passada',()=>{
  const s=exampleState(),week='2026-11-02',t=s.tasks[0];t.status='Concluída';t.completedAt=null;t.due=addDays(week,-7);
  s.timeEntries=[{id:'older',taskId:t.id,date:addDays(week,-14),hours:9},{id:'previous',taskId:t.id,date:addDays(week,-7),hours:2},{id:'now',taskId:t.id,date:week,hours:3}];
  const candidates=reportCandidates(s,week,groupKey(t));assert.ok(candidates.done.some(x=>x.id===t.id));assert.equal(t.completedAt,null);
  const draft={key:'test',done:'',next:'',comments:'',doneTaskIds:[t.id],nextTaskIds:[],doneNotes:'Contexto adicional.'};
  const composed=composeReport(draft,s);assert.match(composed.done,new RegExp(t.title));assert.match(composed.done,/Contexto adicional/);
  const metrics=reportMetrics(s,week,groupKey(t),draft);assert.equal(metrics.workedHours,2);assert.equal(metrics.doneHours,2);assert.equal(metrics.doneCount,1);
  assert.equal(composeReport({...draft,doneTaskIds:[]},s).done,'\nContexto adicional.');
});

test('02–08/11 reúne conclusões de 26/10–01/11 e planejamento de 02–08/11, separado por cliente',()=>{
  const s=emptyState(),base=exampleState().tasks[0],week='2026-11-02';
  s.tasks=['Lucri','CWB Kids'].flatMap(client=>[
    {...base,id:`${client}-monday`,client,status:'Concluída' as const,completedAt:'2026-10-26T12:00:00-03:00',due:null},
    {...base,id:`${client}-sunday`,client,status:'Concluída' as const,completedAt:'2026-11-01T23:30:00-03:00',due:null},
    {...base,id:`${client}-reference`,client,status:'Concluída' as const,completedAt:null,due:'2026-10-30'},
    {...base,id:`${client}-current-done`,client,status:'Concluída' as const,completedAt:'2026-11-02T12:00:00-03:00',due:'2026-10-30'},
    {...base,id:`${client}-older`,client,status:'Concluída' as const,completedAt:'2026-10-25T12:00:00-03:00',due:'2026-10-30'},
    {...base,id:`${client}-current-reference`,client,status:'Concluída' as const,completedAt:null,due:week},
    {...base,id:`${client}-undated`,client,status:'Concluída' as const,completedAt:null,due:null},
    {...base,id:`${client}-due`,client,status:'A fazer' as const,completedAt:null,due:week},
    {...base,id:`${client}-due-sunday`,client,status:'Em andamento' as const,completedAt:null,due:'2026-11-08'},
    {...base,id:`${client}-block`,client,status:'Em andamento' as const,completedAt:null,due:null},
    {...base,id:`${client}-past-due`,client,status:'A fazer' as const,completedAt:null,due:'2026-11-01'},
    {...base,id:`${client}-future-due`,client,status:'A fazer' as const,completedAt:null,due:'2026-11-09'},
    {...base,id:`${client}-past-block`,client,status:'A fazer' as const,completedAt:null,due:null},
    {...base,id:`${client}-future-block`,client,status:'A fazer' as const,completedAt:null,due:null},
  ]);
  s.blocks=['Lucri','CWB Kids'].flatMap(client=>[
    {id:`${client}-current`,taskId:`${client}-block`,date:'2026-11-08',hours:2},
    {id:`${client}-past`,taskId:`${client}-past-block`,date:'2026-11-01',hours:3},
    {id:`${client}-future`,taskId:`${client}-future-block`,date:'2026-11-09',hours:4},
    {id:`${client}-finished`,taskId:`${client}-current-done`,date:week,hours:1},
  ]);
  const before=structuredClone(s);
  for(const client of ['Lucri','CWB Kids']) {
    const candidates=reportCandidates(s,week,`client:${client}`);
    assert.deepEqual(candidates.done.map(t=>t.id),[`${client}-monday`,`${client}-sunday`,`${client}-reference`]);
    assert.deepEqual(candidates.next.map(t=>t.id),[`${client}-due`,`${client}-due-sunday`,`${client}-block`]);
    assert.ok(candidates.tasks.every(t=>t.client===client));
  }
  assert.equal(reportCandidates(s,week,'').done.length,6);
  assert.equal(reportCandidates(s,week,'').next.length,6);
  assert.deepEqual(s,before);
});

test('conclusões na virada da semana seguem São Paulo e atravessam o ano',()=>{
  const s=emptyState(),base=exampleState().tasks[0];
  s.tasks=[
    {...base,id:'sunday-local',status:'Concluída',completedAt:'2026-11-02T01:00:00Z',due:null},
    {...base,id:'monday-local',status:'Concluída',completedAt:'2026-11-02T03:00:00Z',due:null},
  ];
  assert.deepEqual(reportCandidates(s,'2026-11-02','').done.map(t=>t.id),['sunday-local']);
  assert.deepEqual(reportCandidates(s,'2026-11-09','').done.map(t=>t.id),['monday-local']);
  s.tasks[0].completedAt='2027-01-01T12:00:00Z';s.tasks[1].completedAt='2027-01-04T12:00:00Z';
  assert.deepEqual(reportCandidates(s,'2027-01-04','').done.map(t=>t.id),['sunday-local']);
});

test('indicadores usam horas realizadas da semana anterior e blocos da semana selecionada',()=>{
  const s=emptyState(),base=exampleState().tasks[0],week='2026-11-02';
  s.tasks=[
    {...base,id:'done',client:'Lucri',status:'Concluída',completedAt:'2026-10-30T12:00:00Z',due:null},
    {...base,id:'ongoing',client:'Lucri',status:'Em andamento',completedAt:null,due:week},
    {...base,id:'other',client:'CWB Kids',status:'Concluída',completedAt:'2026-10-30T12:00:00Z',due:null},
  ];
  s.timeEntries=[
    {id:'done',taskId:'done',date:'2026-10-30',hours:2},
    {id:'ongoing',taskId:'ongoing',date:'2026-11-01',hours:.5},
    {id:'current',taskId:'done',date:week,hours:3},
    {id:'old',taskId:'done',date:'2026-10-25',hours:4},
    {id:'other',taskId:'other',date:'2026-10-30',hours:5},
  ];
  s.blocks=[
    {id:'current',taskId:'ongoing',date:'2026-11-08',hours:1.5},
    {id:'past',taskId:'ongoing',date:'2026-11-01',hours:3},
    {id:'future',taskId:'ongoing',date:'2026-11-09',hours:4},
    {id:'other',taskId:'other',date:week,hours:5},
  ];
  const draft={key:'metrics',done:'',next:'',comments:''};
  assert.deepEqual(reportMetrics(s,week,'client:Lucri',draft),{doneCount:1,workedHours:2.5,doneHours:2,nextHours:1.5});
  assert.deepEqual(reportMetrics(s,week,'client:Lucri',{...draft,doneTaskIds:[]}),{doneCount:0,workedHours:2.5,doneHours:0,nextHours:1.5});
});
test('PDF suporta relatórios longos e títulos que atravessam dois meses',async()=>{
  assert.equal(defaultReportTitle('2026-11-02','CWB Kids'),'26.10 - 01.11 - CWB Kids');
  const pdf=await buildReportPdf({key:'long',done:'• Tarefa concluída\n'.repeat(180),next:'Próximas ações',comments:'Comentário final.'},'2026-10-19','Faculdade');
  assert.ok(pdf.bytes.byteLength>3000);
});

test('título automático usa a semana anterior e pontos nas datas, inclusive na virada do ano',()=>{
  assert.equal(defaultReportTitle('2026-11-02','Lucri'),'26.10 - 01.11 - Lucri');
  assert.equal(defaultReportTitle('2026-10-26','CWB Kids'),'19-25.10 - CWB Kids');
  assert.equal(defaultReportTitle('2027-01-04','Lucri'),'28.12 - 03.01 - Lucri');
});

test('rascunhos com título automático antigo adotam o novo padrão e títulos personalizados são preservados',()=>{
  const week='2026-11-02',title='26.10 - 01.11 - Lucri';
  assert.equal(initialReportTitle(undefined,week,'Lucri'),title);
  assert.equal(initialReportTitle('02-08/11 - Lucri',week,'Lucri'),title);
  assert.equal(initialReportTitle('26/10 - 01/11 - Lucri',week,'Lucri'),title);
  assert.equal(initialReportTitle(title,week,'Lucri'),title);
  assert.equal(initialReportTitle('Resultados da campanha',week,'Lucri'),'Resultados da campanha');
  assert.equal(initialReportTitle('',week,'Lucri'),'');
});

test('PDF e nome do arquivo usam o mesmo título atual do site, inclusive edições sem salvar',async()=>{
  const week='2026-11-02',state=emptyState();
  for(const title of [defaultReportTitle(week,'Lucri'),'Resultado revisado  - Lucri']) {
    const draft={key:'title',title,done:'',next:'',comments:''};
    const report=composeReport(draft,state),pdf=await buildReportPdf(report,week,'Lucri');
    assert.equal(pdf.filename,`${title}.pdf`);
    assert.ok(Buffer.from(pdf.bytes).toString('latin1').includes(`/Title (${title})`));
    assert.ok(formattedReport(report,week,'Lucri').startsWith(`${title}\n`));
  }
});
