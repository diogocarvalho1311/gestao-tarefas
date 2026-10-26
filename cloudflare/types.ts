export interface Statement {
  bind(...values:unknown[]):Statement;
  first<T=Record<string,unknown>>():Promise<T|null>;
  all<T=Record<string,unknown>>():Promise<{results:T[]}>;
  run():Promise<{meta:{changes:number}}>;
}
export interface Database {
  prepare(sql:string):Statement;
  batch(statements:Statement[]):Promise<{meta:{changes:number}}[]>;
  withSession?(constraint:string):Database;
}
export interface Env {
  DB:Database;
  ASSETS:{fetch(request:Request):Promise<Response>};
  SETUP_TOKEN_HASH?:string;
  SETUP_EXPIRES_AT?:string;
}
