import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { addDays, weekStart, today, type State, type Task } from '../shared/domain.js';

export function emptyState(): State { return {tasks:[],blocks:[],timeEntries:[],availability:{},reports:[],revision:0}; }
export function exampleState(): State {
  const s=emptyState(), week=weekStart();
  const examples: [string,string,Task['priority'],number,number,Task['status']][] = [
    ['Preparar campanha de novembro','Cliente Aurora','Alta',5,2,'Em andamento'],
    ['Revisar calendário de conteúdo','Estúdio Norte','Alta',3,1,'A fazer'],
    ['Analisar resultados da semana','Cliente Aurora','Média',2,4,'A fazer'],
    ['Ajustar página de apresentação','Projeto pessoal','Média',4,3,'Em andamento'],
    ['Enviar relatório de desempenho','Estúdio Norte','Alta',1.5,0,'Concluída'],
    ['Organizar arquivos do projeto','Projeto pessoal','Baixa',1.5,4,'A fazer'],
    ['Pesquisar novas referências','Cliente Aurora','Baixa',2,5,'A fazer'],
    ['Revisar proposta de trabalho','Estúdio Norte','Média',2,3,'A fazer']
  ];
  s.tasks=examples.map(([title,client,priority,estimate,day,status],i)=>({id:`example-${i}`,title,client:client==='Projeto pessoal'?'':client,scope:client==='Projeto pessoal'?'personal':'client',project:client==='Projeto pessoal'?'Meu portfólio':'',priority,status,estimate,due:addDays(week,day),notes:'Tarefa fictícia para experimentar o planejamento.',completedAt:status==='Concluída'?`${today()}T12:00:00-03:00`:null,notionId:null,notionUrl:null,dirty:false,example:true,actual:status==='Concluída'?1.5:0}));
  const plan: [number,number,number][]=[[0,0,2],[1,0,1.5],[4,0,1.5],[0,1,3],[3,1,2],[1,2,1.5],[3,2,2],[2,3,2],[5,4,1.5]];
  s.blocks=plan.map(([i,day,hours])=>({id:randomUUID(),taskId:s.tasks[i].id,date:addDays(week,day),hours}));
  s.timeEntries=[{id:randomUUID(),taskId:s.tasks[4].id,date:today(),hours:1.5}];
  return s;
}
export function openStore(filename: string) {
  if(filename!==':memory:') mkdirSync(dirname(resolve(filename)),{recursive:true});
  const db=new DatabaseSync(filename);
  db.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY CHECK(id=1), data TEXT NOT NULL); CREATE TABLE IF NOT EXISTS notion_baselines (id TEXT PRIMARY KEY, data TEXT NOT NULL)');
  db.exec('CREATE TABLE IF NOT EXISTS task_trash (id TEXT PRIMARY KEY, notion_id TEXT, data TEXT NOT NULL)');
  db.prepare('INSERT OR IGNORE INTO app_state(id,data) VALUES(1,?)').run(JSON.stringify(emptyState()));
  // Retire the old local status without deleting tasks or touching the Notion source.
  const stored=JSON.parse((db.prepare('SELECT data FROM app_state WHERE id=1').get() as {data:string}).data);
  if(stored.tasks.some((t:{status:string})=>t.status==='Bloqueada')) {
    stored.tasks=stored.tasks.map((t:{status:string})=>t.status==='Bloqueada'?{...t,status:'A fazer'}:t);
    stored.revision++;db.prepare('UPDATE app_state SET data=? WHERE id=1').run(JSON.stringify(stored));
  }
  return {
    db,
    read(): State { return JSON.parse((db.prepare('SELECT data FROM app_state WHERE id=1').get() as {data:string}).data); },
    save(state: State) { state.revision++; db.prepare('UPDATE app_state SET data=? WHERE id=1').run(JSON.stringify(state)); return state; },
    baseline(id:string): string|undefined { return (db.prepare('SELECT data FROM notion_baselines WHERE id=?').get(id) as {data:string}|undefined)?.data; },
    setBaseline(id:string,data:string) { db.prepare('INSERT INTO notion_baselines(id,data) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data').run(id,data); },
    trash() {return db.prepare('SELECT data FROM task_trash').all().map(r=>JSON.parse(r.data as string));},
    isRemovedNotion(id:string) {return !!db.prepare('SELECT 1 FROM task_trash WHERE notion_id=?').get(id);},
    removeTask(id:string) {
      const state=this.read(),task=state.tasks.find(t=>t.id===id);if(!task)return null;
      const archived={task,blocks:state.blocks.filter(b=>b.taskId===id),timeEntries:state.timeEntries.filter(e=>e.taskId===id),removedAt:new Date().toISOString()};
      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare('INSERT INTO task_trash(id,notion_id,data) VALUES(?,?,?)').run(id,task.notionId,JSON.stringify(archived));
        state.tasks=state.tasks.filter(t=>t.id!==id);state.blocks=state.blocks.filter(b=>b.taskId!==id);state.timeEntries=state.timeEntries.filter(e=>e.taskId!==id);
        this.save(state);db.exec('COMMIT');return state;
      } catch(e) {db.exec('ROLLBACK');throw e;}
    },
    restoreTask(id:string) {
      const row=db.prepare('SELECT data FROM task_trash WHERE id=?').get(id);if(!row)return null;
      const archived=JSON.parse(row.data as string),state=this.read();
      if(archived.task.status==='Bloqueada')archived.task.status='A fazer';
      db.exec('BEGIN IMMEDIATE');
      try {
        state.tasks.push(archived.task);state.blocks.push(...archived.blocks);state.timeEntries.push(...archived.timeEntries);
        db.prepare('DELETE FROM task_trash WHERE id=?').run(id);this.save(state);db.exec('COMMIT');return state;
      }catch(e){db.exec('ROLLBACK');throw e;}
    }
  };
}
