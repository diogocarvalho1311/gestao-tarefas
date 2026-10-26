import { addDays, today, weekStart, type State, type Task } from './domain.js';
// Public showcase data is independent of the owner's workspace and Notion records.
export function demoState(date=today()):State {
  const week=weekStart(date);
  const seeds:[string,Task['scope'],string,string,number,Task['status'],number|null][]=[
    ['Revisar anúncios da campanha','client','Lucri','',3,'Em andamento',2],
    ['Analisar os indicadores da semana','client','Lucri','',2,'Concluída',0],
    ['Preparar o relatório de resultados','client','Lucri','',1,'A fazer',4],
    ['Configurar novas conversões','client','Lucri','',2,'A fazer',8],
    ['Revisar os criativos da campanha','client','CWB Kids','',2,'Em andamento',1],
    ['Consolidar resultados dos anúncios','client','CWB Kids','',1.5,'Concluída',0],
    ['Ajustar a página de inscrição','client','CWB Kids','',4,'A fazer',3],
    ['Planejar as próximas campanhas','client','CWB Kids','',2,'A fazer',9],
    ['Criar a página inicial do portfólio','personal','','Meu portfólio',3,'Em andamento',2],
    ['Organizar a rotina de trabalho','personal','','',.5,'A fazer',4],
    ['Resolver exercícios de modelagem','academic','','Banco de dados',2,'A fazer',3],
    ['Revisar conceitos de BI','academic','','Inteligência de negócios',1.5,'A fazer',6],
    ['Estudar estatística descritiva','academic','','Estatística',2,'A fazer',null],
    ['Criar uma automação de arquivos','personal','','Automações pessoais',2,'A fazer',10]
  ];
  const tasks:Task[]=seeds.map(([title,scope,client,project,estimate,status,day],i)=>({id:`demo-task-${i}`,title,scope,client,project,estimate,status,priority:i%3===0?'Alta':i%3===1?'Média':'Baixa',due:day===null?null:addDays(week,day),notes:'Tarefa de demonstração com dados fictícios.',personalType:project?'project':'task',completedAt:status==='Concluída'?`${week}T12:00:00Z`:null,notionId:null,notionUrl:null,dirty:false,example:false,actual:0}));
  const planned:[number,number,number][]=[[1,0,2],[5,0,1.5],[0,1,1.5],[4,1,1],[8,2,2],[10,2,1],[6,3,2],[2,4,1],[9,4,.5],[11,5,1],[3,7,2],[7,8,2],[13,9,2]];
  const worked:[number,number,number][]=[[1,0,2],[5,0,1.5],[0,0,1.5],[4,0,.5]];
  const blocks=planned.map(([i,d,hours],n)=>({id:`demo-block-${n}`,taskId:tasks[i].id,date:addDays(week,d),hours}));
  const timeEntries=worked.map(([i,d,hours],n)=>({id:`demo-time-${n}`,taskId:tasks[i].id,date:addDays(week,d),hours}));
  tasks.forEach(t=>{t.actual=timeEntries.filter(e=>e.taskId===t.id).reduce((sum,e)=>sum+e.hours,0);});
  return {tasks,blocks,timeEntries,availability:{[addDays(week,5)]:2},reports:[],revision:0};
}
