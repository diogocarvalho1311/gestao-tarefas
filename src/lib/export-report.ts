import { hours, type Report } from '../../shared/domain';
import { clientTheme, themeColors } from '../../shared/client-theme';
import { defaultReportTitle, reportHeadings, reportPeriod, type ReportMetrics } from '../../shared/reports';

export async function buildReportPdf(report:Report,week:string,label:string,metrics?:ReportMetrics) {
  const {jsPDF}=await import('jspdf');
  const doc=new jsPDF({unit:'mm',format:'a4',compress:true});
  const margin=22,width=166,bottom=274,accent=themeColors[clientTheme(label)];
  const title=report.title||defaultReportTitle(week,label);
  doc.setProperties({title,subject:'Relatório semanal',creator:'DCarvalho'});
  let y=29;
  function paintPage(first=false) {
    doc.setFillColor('#202020');doc.rect(0,0,210,297,'F');
    doc.setFillColor(accent);doc.rect(0,0,210,1.6,'F');
    doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor('#a2a2a2');
    doc.text('DCarvalho',margin,15);doc.text('RELATÓRIO SEMANAL',188,15,{align:'right'});
    if(!first){doc.setDrawColor('#363636');doc.line(margin,20,188,20);}
  }
  paintPage(true);
  const newPage=()=>{doc.addPage();paintPage();y=30;};
  const ensure=(height:number)=>{if(y+height>bottom)newPage();};
  const text=(content:string,x:number,maxWidth:number,fontSize:number,lineHeight:number,bold=false,color='#e7e7e7')=>{
    doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(fontSize);
    const lines=doc.splitTextToSize(content,maxWidth) as string[];
    for(const line of lines){ensure(lineHeight);doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(fontSize);doc.setTextColor(color);doc.text(line,x,y);y+=lineHeight;}
  };
  text(title,margin,width,23,10,true,'#f7f7f7');y+=4;
  doc.setFont('helvetica','bold');doc.setFontSize(10.5);doc.setTextColor(accent);doc.text(label,margin,y);
  doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor('#b0b0b0');doc.text(report.status||'Rascunho',188,y,{align:'right'});y+=7;
  text(reportPeriod(week).replace(' → ',' a '),margin,width,9,5,false,'#a9a9a9');y+=8;
  if(metrics) {
    const cards=[{label:'Entregas selecionadas',value:String(metrics.doneCount)},{label:'Tempo registrado',value:hours(metrics.workedHours)},{label:'Tempo nas entregas',value:hours(metrics.doneHours)},{label:'Próxima semana',value:hours(metrics.nextHours)}];
    ensure(34);const gap=3,cardWidth=(width-gap*3)/4;
    for(let i=0;i<cards.length;i++) {
      const x=margin+i*(cardWidth+gap);
      doc.setFillColor('#1c1c1c');doc.setDrawColor('#383838');doc.roundedRect(x,y,cardWidth,27,3,3,'FD');
      doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.setTextColor('#b2b2b2');doc.text(cards[i].label,x+3,y+7,{maxWidth:cardWidth-5});
      doc.setFont('helvetica','bold');doc.setFontSize(18);doc.setTextColor(accent);doc.text(cards[i].value,x+3,y+20);
    }
    y+=34;text('Tempo registrado considera apenas os apontamentos desta semana.',margin,width,8,4.5,false,'#888888');y+=7;
  }
  const section=(number:string,heading:string,content:string,fallback:string)=>{
    ensure(29);doc.setFillColor(accent);doc.roundedRect(margin,y-4.5,9,7,1.8,1.8,'F');
    doc.setFont('helvetica','bold');doc.setFontSize(8);doc.setTextColor('#101010');doc.text(number,margin+4.5,y,{align:'center'});
    text(heading,margin+13,width-13,12.5,6,true,'#f3f3f3');y+=5;
    for(const line of (content.trim()||fallback).split('\n')) {
      if(!line.trim()){y+=3;continue;}
      const bullet=/^\s*[•\-*]\s+/.test(line),clean=line.replace(/^\s*[•\-*]\s+/,'');
      if(bullet){ensure(6);doc.setFillColor(accent);doc.circle(margin+1.7,y-1,.65,'F');}
      text(clean,bullet?margin+6:margin,bullet?width-6:width,10.5,5.8);y+=2;
    }
    y+=8;
  };
  section('01',reportHeadings.done,report.done,'Nenhuma tarefa selecionada.');
  section('02',reportHeadings.next,report.next,'Nenhuma tarefa selecionada.');
  section('03',reportHeadings.comments,report.comments,'Sem observações.');
  const pages=doc.getNumberOfPages();
  for(let i=1;i<=pages;i++) {
    doc.setPage(i);doc.setDrawColor('#363636');doc.line(margin,280,188,280);
    doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor('#929292');
    const footer=doc.splitTextToSize(title,142) as string[];
    doc.text(footer[0]+(footer.length>1?'…':''),margin,287);doc.text(`${i} / ${pages}`,188,287,{align:'right'});
  }
  const filename=`${title.replace(/[\\/:*?"<>|]/g,'-').replace(/\s+/g,' ').trim()||'Relatório semanal'}.pdf`;
  return {filename,bytes:doc.output('arraybuffer')};
}
export async function downloadReportPdf(report:Report,week:string,label:string,metrics?:ReportMetrics) {
  const {filename,bytes}=await buildReportPdf(report,week,label,metrics);
  const url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));
  const anchor=document.createElement('a');anchor.href=url;anchor.download=filename;anchor.click();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
}
