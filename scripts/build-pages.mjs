import { build } from 'esbuild';
await build({entryPoints:['cloudflare/worker.ts'],outfile:'dist/_worker.js',bundle:true,format:'esm',platform:'neutral',target:'es2022',external:['node:*'],minify:true});
console.log('API de Pages preparada em dist/_worker.js.');
