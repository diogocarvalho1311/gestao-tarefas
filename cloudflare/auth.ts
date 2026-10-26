import { ApiError } from './workspace';
import type { Database, Env } from './types';
const cookieName='__Host-dcarvalho',sessionDays=14;
const encoder=new TextEncoder();
const hex=(bytes:ArrayBuffer)=>Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
export const digest=async(value:string)=>hex(await crypto.subtle.digest('SHA-256',encoder.encode(value)));
const randomToken=()=>hex(crypto.getRandomValues(new Uint8Array(32)).buffer);
export function equal(a:string,b:string) {let diff=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)diff|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return diff===0;}
export async function passwordHash(password:string,salt:string) {
  const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);
  return hex(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:encoder.encode(salt),iterations:100000},key,256));
}
function password(value:unknown):string {
  if(typeof value!=='string'||value.length<12||value.length>256)throw new ApiError(400,'Use uma senha com 12 a 256 caracteres.');return value;
}
function sessionToken(request:Request) {return request.headers.get('Cookie')?.split(';').map(v=>v.trim()).find(v=>v.startsWith(cookieName+'='))?.slice(cookieName.length+1)||'';}
export async function authenticated(request:Request,db:Database) {
  const token=sessionToken(request);if(!/^[a-f0-9]{64}$/.test(token))return false;
  return !!await db.prepare('SELECT token_hash FROM sessions WHERE token_hash=? AND expires_at>?').bind(await digest(token),Date.now()).first();
}
async function newSession(db:Database) {
  const token=randomToken(),maxAge=sessionDays*86400;
  await db.batch([db.prepare('DELETE FROM sessions WHERE expires_at<=?').bind(Date.now()),db.prepare('INSERT INTO sessions(token_hash,expires_at) VALUES(?,?)').bind(await digest(token),Date.now()+maxAge*1000)]);
  return `${cookieName}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
}
async function limit(request:Request,db:Database) {
  const key=await digest(request.headers.get('CF-Connecting-IP')||'local-test'),now=Date.now();
  await db.prepare('INSERT INTO auth_attempts(key,attempts,reset_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN reset_at<=? THEN 1 ELSE attempts+1 END,reset_at=CASE WHEN reset_at<=? THEN excluded.reset_at ELSE reset_at END').bind(key,now+15*60*1000,now,now).run();
  const row=await db.prepare('SELECT attempts FROM auth_attempts WHERE key=?').bind(key).first<{attempts:number}>();
  if(row&&row.attempts>10)throw new ApiError(429,'Muitas tentativas. Aguarde 15 minutos para tentar novamente.');return key;
}
export async function authResponse(path:string,request:Request,env:Env,body:Record<string,unknown>,db:Database):Promise<Response> {
  if(path==='/auth/session'&&request.method==='GET') {
    const owner=await db.prepare('SELECT id FROM owner WHERE id=1').first();
    return Response.json({mode:'cloud',initialized:!!owner,authenticated:await authenticated(request,db)});
  }
  if(path==='/auth/logout'&&request.method==='POST') {
    const token=sessionToken(request);if(token)await db.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await digest(token)).run();
    return Response.json({ok:true},{headers:{'Set-Cookie':`${cookieName}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`}});
  }
  if((path==='/auth/setup'||path==='/auth/login')&&request.method==='POST') {
    const key=await limit(request,db);
    if(path==='/auth/setup') {
      if(!env.SETUP_TOKEN_HASH||Date.now()>Number(env.SETUP_EXPIRES_AT||0)||typeof body.token!=='string'||!equal(await digest(body.token),env.SETUP_TOKEN_HASH))throw new ApiError(403,'Link de ativação inválido ou expirado.');
      const salt=randomToken(),hash=await passwordHash(password(body.password),salt);
      const result=await db.prepare('INSERT OR IGNORE INTO owner(id,password_hash,salt,created_at) VALUES(1,?,?,?)').bind(hash,salt,Date.now()).run();
      if(!result.meta.changes)throw new ApiError(409,'A senha já foi criada. Entre na sua conta.');
    } else {
      if(typeof body.password!=='string'||body.password.length>256)throw new ApiError(401,'Senha incorreta.');
      const owner=await db.prepare('SELECT password_hash,salt FROM owner WHERE id=1').first<{password_hash:string;salt:string}>();
      const hash=await passwordHash(body.password,owner?.salt||'uninitialized-owner');
      if(!owner||!equal(hash,owner.password_hash))throw new ApiError(401,'Senha incorreta.');
    }
    await db.prepare('DELETE FROM auth_attempts WHERE key=?').bind(key).run();
    return Response.json({ok:true},{headers:{'Set-Cookie':await newSession(db)}});
  }
  throw new ApiError(404,'Operação não encontrada.');
}
