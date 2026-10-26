import { randomUUID } from 'node:crypto';
import process from 'node:process';
import type { Task, State } from '../shared/domain.js';
export interface NotionStore {
  read():State;save(state:State):State;baseline(id:string):string|undefined;
  setBaseline(id:string,value:string):void;isRemovedNotion(id:string):boolean;db:{exec(sql:string):unknown};
}

const config=()=>({token:process.env.NOTION_TOKEN,source:process.env.NOTION_DATA_SOURCE_ID});
export function notionStatus() { const c=config();return {configured:!!c.token,mode:'read-only',source:c.source||null}; }
type RichText={plain_text?:string;text?:{content:string}};
type Property={type:string;title?:RichText[];rich_text?:RichText[];date?:{start:string}|null;status?:{name:string}|null;select?:{name:string}|null;multi_select?:{name:string}[]};
type Page={id:string;url:string;properties:Record<string,Property>;archived?:boolean;in_trash?:boolean};
type Schema={id:string;title?:RichText[];properties:Record<string,Property>};
interface Mapping {title:string;client?:string;due?:string;priority?:string;status:string;area?:string}
const plain=(p?:Property)=>(p?.title||p?.rich_text||[]).map(r=>r.plain_text||r.text?.content||'').join('');
const value=(p?:Property)=>p?.select?.name||p?.status?.name||p?.multi_select?.map(v=>v.name).join(', ')||plain(p);
const normalize=(text:string)=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

async function request(path:string,body?:unknown):Promise<any> {
  if(!config().token)throw new Error('Configure apenas NOTION_TOKEN no .env e reinicie o app. Os demais campos podem ser detectados.');
  for(let attempt=0;attempt<3;attempt++) {
    const res=await fetch(`https://api.notion.com/v1/${path}`,{method:body?'POST':'GET',headers:{Authorization:`Bearer ${config().token}`,'Notion-Version':'2025-09-03','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(30000)});
    if(res.status===429&&attempt<2) {await new Promise(r=>setTimeout(r,Math.min(5000,Number(res.headers.get('retry-after')||1)*1000)));continue;}
    if(!res.ok) {
      const messages:Record<number,string>={401:'Token do Notion inválido.',403:'A integração não tem permissão de leitura.',404:'Base não encontrada. Confira o ID e compartilhe a base com a integração.',429:'Limite de requisições do Notion atingido. Tente em alguns minutos.'};
      const error=new Error(messages[res.status]||`O Notion retornou erro ${res.status}. Nenhum dado remoto foi alterado.`);
      Object.assign(error,{status:res.status});throw error;
    }
    return res.json();
  }
}

// Property names and types come from the remote schema, never from guessed IDs.
export function detectMapping(schema:Schema):Mapping {
  const props=schema.properties;
  const find=(override:string|undefined,names:string[],types:string[])=>{
    if(override) {
      if(!props[override]||!types.includes(props[override].type))throw new Error(`Mapeamento inválido: confira a propriedade “${override}” no .env.`);
      return override;
    }
    return names.find(n=>props[n]&&types.includes(props[n].type));
  };
  const title=find(process.env.NOTION_TITLE_PROPERTY,['Nome','Nome da tarefa','Name','Título'],['title'])||Object.keys(props).find(k=>props[k].type==='title');
  const status=find(process.env.NOTION_STATUS_PROPERTY,['Status','Estado'],['status','select']);
  if(!title||!status)throw new Error('Mapeamento inválido: esta fonte precisa de título e status para importar tarefas.');
  return {title,status,client:find(process.env.NOTION_CLIENT_PROPERTY,['Cliente','Empresa'],['rich_text','select','multi_select']),due:find(process.env.NOTION_DUE_PROPERTY,['Prazo','Data','Date'],['date']),priority:find(process.env.NOTION_PRIORITY_PROPERTY,['Prioridade','Priority'],['select','status']),area:find(process.env.NOTION_AREA_PROPERTY,['Área','Area'],['select','multi_select','rich_text'])};
}
async function sourceSchema():Promise<Schema> {
  const id=config().source?.trim();
  if(id) {
    try {return await request(`data_sources/${id}`);}
    catch(error) {
      if((error as {status?:number}).status!==404)throw error;
      // A database ID from the copied Notion URL is also accepted.
      const db=await request(`databases/${id}`);
      if(db.data_sources?.length!==1)throw new Error('Essa base tem várias fontes. Informe o ID da fonte de tarefas no .env.');
      return request(`data_sources/${db.data_sources[0].id}`);
    }
  }
  const matches:Schema[]=[];let cursor:string|undefined;
  do {
    const data=await request('search',{filter:{property:'object',value:'data_source'},page_size:100,...(cursor?{start_cursor:cursor}:{})});
    for(const source of data.results) {
      const title=(source.title||[]).map((t:RichText)=>t.plain_text||t.text?.content||'').join('');
      if(/tarefas|tasks/i.test(title)) {try{detectMapping(source);matches.push(source);}catch{}}
    }
    cursor=data.has_more?data.next_cursor:undefined;
  }while(cursor);
  if(matches.length!==1)throw new Error(matches.length?'Há mais de uma base de tarefas. Informe NOTION_DATA_SOURCE_ID no .env.':'Nenhuma base de tarefas foi encontrada. Compartilhe sua base com a integração.');
  return matches[0];
}
export function mapPage(page:Page,mapping?:Mapping):Pick<Task,'title'|'client'|'due'|'priority'|'status'> {
  const m=mapping||{title:process.env.NOTION_TITLE_PROPERTY||'Nome da tarefa',client:process.env.NOTION_CLIENT_PROPERTY||'Empresa',due:process.env.NOTION_DUE_PROPERTY||'Prazo',priority:process.env.NOTION_PRIORITY_PROPERTY||'Prioridade',status:process.env.NOTION_STATUS_PROPERTY||'Status'};
  const p=page.properties,raw=normalize(value(p[m.status]));
  const status:Task['status']=/concluid|done|complete/.test(raw)?'Concluída':/andamento|progress/.test(raw)?'Em andamento':'A fazer';
  const priority=m.priority?normalize(value(p[m.priority])):'';
  return {title:plain(p[m.title])||'Sem título',client:m.client?value(p[m.client]):'',due:m.due?p[m.due]?.date?.start?.slice(0,10)||null:null,priority:priority==='alta'?'Alta':priority==='baixa'?'Baixa':'Média',status};
}
export function pageScope(page:Page,mapping:Mapping):Task['scope'] {
  const area=normalize(mapping.area?value(page.properties[mapping.area]):'');
  if(area.includes('faculdade')||area.includes('academ'))return 'academic';
  if(area.includes('pessoal'))return 'personal';
  return mapping.client&&value(page.properties[mapping.client])?'client':'personal';
}
export async function importNotion(store:NotionStore) {
  const schema=await sourceSchema(),mapping=detectMapping(schema),pages:Page[]=[];
  let cursor:string|undefined;
  do {
    const filter=process.env.NOTION_ASSIGNEE_ID?{property:process.env.NOTION_ASSIGNEE_PROPERTY||'Responsável',people:{contains:process.env.NOTION_ASSIGNEE_ID}}:undefined;
    const result=await request(`data_sources/${schema.id}/query`,{page_size:100,...(cursor?{start_cursor:cursor}:{}),...(filter?{filter}:{})});
    pages.push(...result.results);cursor=result.has_more?result.next_cursor:undefined;
  } while(cursor);
  const state=store.read();let imported=0,updated=0,conflicts=0;
  store.db.exec('BEGIN IMMEDIATE');
  try {
    for(const p of pages) {
      if(store.isRemovedNotion(p.id))continue;
      if(p.archived||p.in_trash||/arquivad|archived/.test(normalize(value(p.properties[mapping.status]))))continue;
      const mapped=mapPage(p,mapping),serialized=JSON.stringify(mapped),scope=pageScope(p,mapping);
      const notionFields=['title','status',...(mapping.client?['client']:[]),...(mapping.due?['due']:[]),...(mapping.priority?['priority']:[])];
      const current=state.tasks.find(t=>t.notionId===p.id);
      if(current) {
        if(current.dirty) {current.conflict=store.baseline(p.id)!==serialized;if(current.conflict)conflicts++;continue;}
        if(mapped.status!=='Concluída')current.completedAt=null;
        // Preserve local priorities when the source has no priority property.
        const priority=mapping.priority?mapped.priority:current.priority;
        Object.assign(current,mapped,{priority,scope,notionFields,notionUrl:p.url,conflict:false});updated++;
      } else {
        state.tasks.push({id:randomUUID(),...mapped,scope,notionFields,project:'',estimate:0,notes:'',completedAt:null,notionId:p.id,notionUrl:p.url,dirty:false,example:false,actual:0});imported++;
      }
      store.setBaseline(p.id,serialized);
    }
    store.save(state);store.db.exec('COMMIT');
  } catch(e) {store.db.exec('ROLLBACK');throw e;}
  return {imported,updated,conflicts,source:schema.id,total:pages.length,message:`${imported} importadas · ${updated} atualizadas${conflicts?` · ${conflicts} conflitos preservados para revisão`:''}. Leitura concluída.`};
}
