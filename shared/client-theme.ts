import { isPersonalProject, type Task } from './domain.js';
export function clientTheme(client:string) {
  const name=client.trim().toLocaleLowerCase('pt-BR');
  return name==='cwb kids'?'cwb':name==='lucri'?'lucri':'other';
}
export function taskDot(task:Task) {return task.scope==='client'?`client-${clientTheme(task.client)}`:task.scope==='academic'?'academic':isPersonalProject(task)?'personal-project':'personal-task';}
export function groupTone(key:string) {return key.startsWith('client:')?`client-${clientTheme(key.slice(7))}`:key.startsWith('academic:')?'academic':key.slice(9)?'personal-project':'personal-task';}
export const themeColors={cwb:'#e792bb',lucri:'#90c9a3',other:'#e29a67'};
