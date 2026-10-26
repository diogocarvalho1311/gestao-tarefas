// Management-only commands. Credentials and exported records never enter the repository.
import 'dotenv/config';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync,writeFileSync,mkdirSync,existsSync } from 'node:fs';
import { join,resolve } from 'node:path';
import { randomBytes,createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
const source=process.env.DCARVALHO_SOURCE_DIR||process.cwd(),privateDir=join(source,'.cloudflare');
const config=JSON.parse(readFileSync('wrangler.jsonc','utf8')),account=config.account_id,database=config.d1_databases[0].database_id;
const privateState=join(privateDir,'deployment.json');mkdirSync(privateDir,{recursive:true});
const sha=value=>createHash('sha256').update(value).digest('hex');
function token() {
  if(process.env.CLOUDFLARE_API_TOKEN)return process.env.CLOUDFLARE_API_TOKEN;
  const file=join(process.env.APPDATA||join(process.env.USERPROFILE,'AppData','Roaming'),'xdg.config','.wrangler','config','default.toml');
  const contents=readFileSync(file,'utf8'),match=contents.match(/^oauth_token\s*=\s*"([^"]+)"/m);
  if(!match)throw Error('Conecte a conta com npx wrangler login.');return match[1];
}
export async function cloudflareApi(path,body,method=body?'POST':'GET') {
  const r=await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}${path}`,{method,headers:{Authorization:`Bearer ${token()}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
  const result=await r.json();if(!r.ok||!result.success)throw Error(`Cloudflare: ${r.status} ${result.errors?.map(e=>e.message).join('; ')||'Falha na solicitação'}`);return result.result;
}
async function query(sql,params=[]) {return (await cloudflareApi(`/d1/database/${database}/query`,{sql,params}))[0];}
async function wranglerSecrets(values) {
  await new Promise((done,reject)=>{
    const child=spawn(process.execPath,[resolve('node_modules/wrangler/bin/wrangler.js'),'secret','bulk'],{stdio:['pipe','inherit','inherit']});
    child.stdin.end(JSON.stringify(values));child.on('error',reject);child.on('exit',code=>code===0?done():reject(Error('Não foi possível configurar os segredos.')));
  });
}
const action=process.argv[2];
try {
  if(action==='secrets') {
    const owner=await query('SELECT id FROM owner WHERE id=1');
    let deployment=existsSync(privateState)?JSON.parse(readFileSync(privateState,'utf8')):{};
    const values={};
    if(!owner.results.length) {
      if(!deployment.setupToken||deployment.expiresAt<Date.now())deployment={setupToken:randomBytes(32).toString('hex'),expiresAt:Date.now()+3*86400000};
      values.SETUP_TOKEN_HASH=sha(deployment.setupToken);values.SETUP_EXPIRES_AT=String(deployment.expiresAt);
      writeFileSync(privateState,JSON.stringify(deployment,null,2));
    }
    for(const [key,value] of Object.entries(process.env))if(key.startsWith('NOTION_')&&value)values[key]=value;
    if(Object.keys(values).length)await wranglerSecrets(values);
    console.log('Segredos configurados no Worker. Nenhum valor foi enviado ao Git.');
  } else if(action==='import-local') {
    const filename=process.env.DATABASE_PATH||process.env.COMPASSO_DEFAULT_DB;
    if(!filename)throw Error('Informe DATABASE_PATH ou execute pelo npm.');
    const db=new DatabaseSync(filename,{readOnly:true});db.exec('BEGIN');
    let doc;
    try {
      const state=JSON.parse(db.prepare('SELECT data FROM app_state WHERE id=1').get().data);
      const trash=Object.fromEntries(db.prepare('SELECT id,data FROM task_trash').all().map(r=>[r.id,JSON.parse(r.data)]));
      const baselines=Object.fromEntries(db.prepare('SELECT id,data FROM notion_baselines').all().map(r=>[r.id,r.data]));
      doc={state,trash,baselines};db.exec('COMMIT');
    }finally{db.close();}
    const serialized=JSON.stringify(doc),backup=join(privateDir,`local-before-migration-${Date.now()}.json`);writeFileSync(backup,serialized);
    const result=await query("UPDATE workspace SET data=?,revision=? WHERE id=1 AND revision=0 AND json_array_length(data,'$.state.tasks')=0",[serialized,doc.state.revision]);
    if(!result.meta.changes)throw Error('A nuvem já contém dados. A importação foi recusada para preservar alterações online.');
    const saved=(await query('SELECT data FROM workspace WHERE id=1')).results[0].data;
    if(sha(saved)!==sha(serialized))throw Error('A conferência dos dados importados falhou.');
    console.log(JSON.stringify({imported:true,tasks:doc.state.tasks.length,blocks:doc.state.blocks.length,timeEntries:doc.state.timeEntries.length,reports:doc.state.reports.length,trash:Object.keys(doc.trash).length,verified:true,backup}));
  } else if(action==='status') {
    const row=(await query('SELECT data,revision FROM workspace WHERE id=1')).results[0],doc=JSON.parse(row.data);
    const owner=await query('SELECT id FROM owner WHERE id=1');
    console.log(JSON.stringify({tasks:doc.state.tasks.length,blocks:doc.state.blocks.length,reports:doc.state.reports.length,revision:row.revision,ownerInitialized:!!owner.results.length}));
  } else if(action==='activation') {
    const deployment=JSON.parse(readFileSync(privateState,'utf8'));
    const subdomain=(await cloudflareApi('/workers/subdomain')).subdomain;
    const url=`https://${config.name}.${subdomain}.workers.dev`;
    const shortcut=join(privateDir,'Primeiro acesso.url');
    writeFileSync(shortcut,`[InternetShortcut]\r\nURL=${url}/#setup=${deployment.setupToken}\r\n`);
    console.log(JSON.stringify({url,activationShortcut:shortcut,expiresAt:new Date(deployment.expiresAt).toISOString()}));
  } else throw Error('Comando desconhecido.');
}catch(e){console.error(e.message);process.exitCode=1;}
