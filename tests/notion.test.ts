import { test } from 'node:test';
import assert from 'node:assert/strict';
import { importNotion, detectMapping, mapPage, pageScope } from '../server/notion.js';
import { openStore } from '../server/store.js';
test('importação paginada é idempotente, não inventa conclusão e preserva edição local em conflito',async()=>{
  const oldFetch=globalThis.fetch,oldToken=process.env.NOTION_TOKEN,oldSource=process.env.NOTION_DATA_SOURCE_ID;
  process.env.NOTION_TOKEN='test-not-a-real-token';process.env.NOTION_DATA_SOURCE_ID='test-source';
  const store=openStore(':memory:');let title='Tarefa remota',pageCount=0;const methods:string[]=[];
  const page=()=>({id:'remote-1',url:'https://www.notion.so/remote-1',properties:{'Nome da tarefa':{type:'title',title:[{plain_text:title}]},Empresa:{type:'rich_text',rich_text:[{plain_text:'Cliente teste'}]},Prazo:{type:'date',date:{start:'2026-10-30'}},Prioridade:{type:'select',select:{name:'Alta'}},Status:{type:'status',status:{name:'Concluída'}}}});
  globalThis.fetch=async(input,init)=>{
    const url=String(input);methods.push(`${init?.method} ${url}`);
    if(url.endsWith('/query')) {const body=JSON.parse(String(init?.body));pageCount++;return Response.json(body.start_cursor?{results:[],has_more:false}:{results:[page()],has_more:true,next_cursor:'second'});}
    return Response.json({properties:{'Nome da tarefa':{type:'title'},Empresa:{type:'rich_text'},Prazo:{type:'date'},Prioridade:{type:'select'},Status:{type:'status'}}});
  };
  try {
    await importNotion(store);assert.equal(pageCount,2);let s=store.read();assert.equal(s.tasks.length,1);assert.equal(s.tasks[0].completedAt,null);
    s.tasks[0].estimate=5;store.save(s);await importNotion(store);s=store.read();assert.equal(s.tasks.length,1);assert.equal(s.tasks[0].estimate,5);
    s.tasks[0].title='Minha alteração';s.tasks[0].dirty=true;store.save(s);title='Alteração no Notion';
    const result=await importNotion(store);s=store.read();assert.equal(result.conflicts,1);assert.equal(s.tasks[0].title,'Minha alteração');assert.equal(s.tasks[0].conflict,true);
    assert.ok(methods.every(m=>m.startsWith('GET ')||(m.startsWith('POST ')&&m.endsWith('/query'))));
    store.removeTask(s.tasks[0].id);await importNotion(store);assert.equal(store.read().tasks.length,0);assert.equal(store.isRemovedNotion('remote-1'),true);
    store.restoreTask(s.tasks[0].id);
    globalThis.fetch=async()=>Response.json({properties:{}});await assert.rejects(()=>importNotion(store),/Mapeamento inválido/);assert.equal(store.read().tasks[0].title,'Minha alteração');
  } finally {globalThis.fetch=oldFetch;store.db.close();if(oldToken===undefined)delete process.env.NOTION_TOKEN;else process.env.NOTION_TOKEN=oldToken;if(oldSource===undefined)delete process.env.NOTION_DATA_SOURCE_ID;else process.env.NOTION_DATA_SOURCE_ID=oldSource;}
});
test('base atual: Cliente e Status são select, Área separa Faculdade e Pessoal e não há prioridade',()=>{
  const schema={id:'source',properties:{Nome:{type:'title'},Cliente:{type:'select'},Data:{type:'date'},Status:{type:'select'},'Área':{type:'select'}}};
  const mapping=detectMapping(schema);
  assert.equal(mapping.title,'Nome');assert.equal(mapping.client,'Cliente');assert.equal(mapping.priority,undefined);
  const page={id:'p',url:'https://www.notion.so/p',properties:{Nome:{type:'title',title:[{plain_text:'Estudar banco de dados'}]},Cliente:{type:'select',select:null},Data:{type:'date',date:{start:'2026-11-04'}},Status:{type:'select',select:{name:'Concluído'}},'Área':{type:'select',select:{name:'Faculdade'}}}};
  assert.equal(mapPage(page,mapping).status,'Concluída');assert.equal(mapPage(page,mapping).due,'2026-11-04');assert.equal(pageScope(page,mapping),'academic');
  page.properties['Área'].select={name:'Pessoal'};assert.equal(pageScope(page,mapping),'personal');
});
