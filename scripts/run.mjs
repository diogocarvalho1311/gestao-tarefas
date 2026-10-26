// Keep dependencies and SQLite off cloud-synced drives; source stays in the project.
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync, rmSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
const source=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const root=join(process.env.LOCALAPPDATA||process.env.XDG_DATA_HOME||join(process.env.USERPROFILE||process.env.HOME,'.local','share'),'Compasso');
const key=createHash('sha256').update(source).digest('hex').slice(0,12);
const runtime=join(root,`runtime-${key}`);
mkdirSync(runtime,{recursive:true});mkdirSync(join(root,`data-${key}`),{recursive:true});
for(const name of ['package.json','package-lock.json','tsconfig.json','vite.config.ts','index.html','wrangler.jsonc','src','server','shared','tests','scripts','cloudflare','public']) {
  const from=join(source,name);if(existsSync(from)) cpSync(from,join(runtime,name),{recursive:true,force:true});
}
if(existsSync(join(source,'.env'))) cpSync(join(source,'.env'),join(runtime,'.env'));
else if(existsSync(join(runtime,'.env'))) rmSync(join(runtime,'.env'));
const contents=readFileSync(join(source,'package.json'),'utf8');
const deps=JSON.parse(contents);const fingerprint=JSON.stringify([deps.dependencies,deps.devDependencies]);
const marker=join(runtime,'.installed');
async function run(bin,args,extra={}) {
  return new Promise((done,reject)=>{
    const child=spawn(bin,args,{cwd:runtime,stdio:'inherit',env:{...process.env,DCARVALHO_SOURCE_DIR:source,COMPASSO_DEFAULT_DB:join(root,`data-${key}`,'compasso.sqlite'),...extra},shell:false});
    child.once('error',reject);child.once('exit',code=>code===0?done():reject(new Error(`Comando encerrou com código ${code}.`)));
    for(const sig of ['SIGINT','SIGTERM']) process.once(sig,()=>child.kill(sig));
  });
}
try {
  if(!existsSync(marker)||readFileSync(marker,'utf8')!==fingerprint) {
    console.log('Preparando dependências na pasta local do Windows…');
    const npmCli=process.env.npm_execpath;
    if(!npmCli) throw new Error('Execute pelo npm: npm run dev');
    await run(process.execPath,[npmCli,'install','--no-audit','--no-fund','--cache',join(root,'npm-cache')]);
    cpSync(join(runtime,'package-lock.json'),join(source,'package-lock.json'));
    writeFileSync(marker,fingerprint);
  }
  const tsx=join(runtime,'node_modules','tsx','dist','cli.mjs');
  const mode=process.argv[2]||'dev';
  console.log(`Dados locais: ${join(root,`data-${key}`)}`);
  async function build() {
    await run(process.execPath,[join(runtime,'node_modules','typescript','bin','tsc'),'--noEmit']);
    await run(process.execPath,[join(runtime,'node_modules','vite','bin','vite.js'),'build']);
    cpSync(join(runtime,'dist'),join(source,'dist'),{recursive:true,force:true});
  }
  if(mode==='build') {
    await build();
  } else if(mode.startsWith('cloudflare-')) {
    const action=mode.slice('cloudflare-'.length),wrangler=join(runtime,'node_modules','wrangler','bin','wrangler.js');
    if(action==='dev'||action==='deploy') {
      await build();
      await run(process.execPath,['scripts/build-pages.mjs']);
      if(action==='dev') {
        const vars=join(source,'.dev.vars');if(existsSync(vars))cpSync(vars,join(runtime,'.dev.vars'));
        await run(process.execPath,[wrangler,'pages','dev','dist','--port','3199']);
      } else await run(process.execPath,[wrangler,'pages','deploy','dist','--project-name','dcarvalho-tarefas','--branch','main','--commit-dirty=true']);
    } else if(action==='migrate') await run(process.execPath,[wrangler,'d1','migrations','apply','dcarvalho-gestao','--remote']);
    else await run(process.execPath,['scripts/cloudflare.mjs',action]);
  } else if(mode==='test') {
    await run(process.execPath,[tsx,'--test',...readdirSync(join(runtime,'tests')).filter(f=>f.endsWith('.test.ts')).map(f=>`tests/${f}`)]);
  } else if(mode==='smoke') {
    await run(process.execPath,[tsx,'tests/smoke.ts']);
  } else {
    if(mode==='start') {
      if(!existsSync(join(source,'dist'))) throw new Error('Execute npm run build primeiro.');
      cpSync(join(source,'dist'),join(runtime,'dist'),{recursive:true,force:true});
    }
    await run(process.execPath,[tsx,'server/index.ts',...(mode==='start'?['--production']:[])]);
  }
} catch(e) {console.error(e.message);process.exitCode=1;}
