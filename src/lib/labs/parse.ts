import { clean, normalize } from './catalog';
import { parseDate, resultFromCells, type LabReport, type LabResult } from './format';
export function metadata(text: string) {
  const n=normalize(text);
  const collection=n.match(/data\s*(?:si|și)?\s*ora\s*recoltarii\s*(?:setului de analize)?\s*:\s*([^\n]+)/)?.[1] ?? n.match(/data recoltarii\s*:\s*([^\n]+)/)?.[1] ?? '';
  const collectedAt=parseDate(collection);
  const id=n.match(/cod pacient\s*:\s*(\d+)/)?.[1] ?? n.match(/cnp\s*:\s*(\d{13})/)?.[1];
  const patientName=clean(text.match(/NUME:\s*([^\n]+?)(?=\s*(?:CNP|MCP|Cod pacient|Telefon|Varsta|Vârsta|Sex|Data nasterii|Data nașterii)\s*:|\n|$)/i)?.[1] ?? 'Pacient neidentificat');
  return {collectedAt,patientKey:id?`patient:${id}`:normalize(patientName)==='pacient neidentificat'?'':'name:'+normalize(patientName),patientName};
}
function elementText(el: Element) {
  const node=el.cloneNode(true) as Element;
  node.querySelectorAll('br').forEach(br=>br.replaceWith('\n'));
  return node.textContent ?? '';
}
function unitAndReference(cell: Element) {
  const node=cell.cloneNode(true) as Element;
  node.querySelectorAll('sup').forEach(s=>s.replaceWith(`^${s.textContent}`));
  const ref=node.querySelector('b,strong');
  if (ref) { const reference=clean(ref.textContent??''); ref.remove(); return {reference,unit:clean(node.textContent??'')}; }
  return splitReference(clean(node.textContent??''));
}
export function splitReference(text: string) {
  const units=text.match(/(?:10\s*\^?\s*[36]\s*\/\s*[µμu]l|(?:[\wµμ]+\s*\/\s*[\wµμ]+)|\/\s*(?:[µμu]l|camp microscopic)|%|mm\/h|sec|fL|pg)\s*$/i);
  const unit=units?.[0]??'';
  return {reference:clean(unit?text.slice(0,text.length-unit.length):text),unit:clean(unit)};
}
const isSmear=(text:string)=>/frotiu\s+(?:sangvin|sanguin)/.test(normalize(text));
// Interpret only explicit laboratory conclusions, never infer assay cutoffs from normal ranges.
function attachInterpretation(results:LabResult[], index:number|undefined, comment:LabResult) {
  if(index===undefined) return;
  const result=results[index];
  if(!result || !['Ac Anti HCV','Antigen HBs','Ac Anti HIV'].includes(result.name)) return;
  const value=normalize(comment.value).replace(/[.!]+$/,'');
  if(!['negativ','pozitiv','neconcludent','echivoc','reactiv','nereactiv','non-reactiv'].includes(value)) return;
  result.interpretation=value;
  comment.interpretationFor=index;
}
export function parseHtml(html: string, filename: string, id: string): LabReport {
  const doc=new DOMParser().parseFromString(html,'text/html');
  doc.querySelectorAll('script,style,iframe,object,embed,link,img,input').forEach(el=>el.remove());
  const meta=metadata(elementText(doc.body));
  const results: LabResult[]=[]; const warnings:string[]=[];
  for(const table of doc.querySelectorAll('table.Rap_table_class_generic,table.Rap_table_class_buletin_2')) {
    const heading=normalize(table.querySelector('thead')?.textContent??'');
    if(!heading.includes('denumire analiza') || !heading.includes('rezultat')) continue;
    const baseSection:LabResult['section']=/urini|urina/.test(heading)?'urine':isSmear(heading)?'smear':'blood';
    let section=baseSection, previousResult:number|undefined;
    for(const row of table.querySelectorAll(':scope > tbody > tr')) {
      const cells=[...row.children].filter(c=>c.tagName==='TD'||c.tagName==='TH');
      const [nameCell,valueCell,referenceCell]=cells;
      if(!nameCell) continue;
      const first=nameCell.cloneNode(true) as Element;
      first.querySelectorAll('i,img').forEach(el=>el.remove());
      const rawName=clean(first.textContent??'');
      if(cells.length===1 && Number(nameCell.getAttribute('colspan'))===3 && row.classList.contains('analiza')) {
        section=isSmear(rawName)?'smear':baseSection;
        previousResult=undefined;
        continue;
      }
      if(!valueCell) continue;
      const value=clean(valueCell.textContent??'');
      if(!rawName||!value) continue;
      if(cells.length===2 && valueCell.getAttribute('colspan')==='2') {
        const comment=resultFromCells(rawName,value,'','',section,meta.collectedAt,filename,true);
        if(/^comentari/.test(normalize(rawName))) attachInterpretation(results,previousResult,comment);
        results.push(comment); continue;
      }
      if(!referenceCell||cells.length!==3||cells.some(c=>Number(c.getAttribute('colspan')??1)>1)) continue;
      const {unit,reference}=unitAndReference(referenceCell);
      previousResult=results.length;
      results.push(resultFromCells(rawName,value,unit,/^[-–\s]*$/.test(reference)?'':reference,section,meta.collectedAt,filename));
    }
  }
  if(!results.length) throw new Error('Nu s-au găsit rezultate în tabelele buletinului HTML.');
  if(!meta.collectedAt) warnings.push('Data recoltării nu a fost identificată. Completeaz-o înainte de formatare.');
  if(!meta.patientKey) warnings.push('Pacient neidentificat: verifică apartenența buletinului înainte de combinare.');
  return {id,filename,...meta,patientKey:meta.patientKey||`unknown:${id}`,results,warnings};
}
export type PositionedText = { text: string; x: number; y: number; page: number; width: number };
// PDF text is grouped by physical baseline, not the order of text objects in the file.
export function parsePdfItems(items: PositionedText[], filename: string, id: string): LabReport {
  const lines:{page:number;y:number;items:PositionedText[]}[]=[];
  for(const item of [...items].sort((a,b)=>a.page-b.page||b.y-a.y||a.x-b.x)) {
    const previous=lines[lines.length-1];
    if(previous && previous.page===item.page && Math.abs(previous.y-item.y)<3) previous.items.push(item);
    else lines.push({page:item.page,y:item.y,items:[item]});
  }
  for(const line of lines) line.items.sort((a,b)=>a.x-b.x);
  const text=lines.map(l=>l.items.map(i=>i.text).join(' ')).join('\n');
  const meta=metadata(text); const results:LabResult[]=[]; const warnings:string[]=[];
  let section:LabResult['section']='blood';
  let resultX:number|undefined, referenceX:number|undefined, inTable=false, previousResult:number|undefined;
  for(const line of lines) {
    const s=normalize(line.items.map(i=>i.text).join(' '));
    if (/^(?:hematologie|chimie clinica|coagulare|imunologie|urini|frotiu)/.test(s)) { section=/urini|urina/.test(s)?'urine':/frotiu/.test(s)?'smear':'blood'; }
    if(isSmear(s)) {section='smear';previousResult=undefined;continue;}
    const resultHeading=line.items.find(i=>/^rezultat$/i.test(clean(i.text)));
    const referenceHeading=line.items.find(i=>/interval biologic|referinta\/um/i.test(normalize(i.text)));
    if(resultHeading) { resultX=resultHeading.x; if(referenceHeading) referenceX=referenceHeading.x; inTable=true; continue; }
    if(/validat de:|note:|data tiparirii|rezultatele din prezentul/.test(s)) {inTable=false; continue;}
    if(!inTable || resultX===undefined || referenceX===undefined || /denumire analiza|de referinta|starea probei/.test(s)) continue;
    const rx=resultX, fx=referenceX;
    const name=clean(line.items.filter(i=>i.x<rx-12).map(i=>i.text).join(' '));
    const value=clean(line.items.filter(i=>i.x>=rx-12 && i.x<fx-12).map(i=>i.text).join(' '));
    const ref=clean(line.items.filter(i=>i.x>=fx-12).map(i=>i.text).join(' '));
    if(!name||/^\(tip proba|\(metoda|examen complet de urina/.test(normalize(name))) continue;
    if(!value) continue;
    if(/^comentari/.test(normalize(name))) {
      const comment=resultFromCells(name,clean([value,ref].filter(Boolean).join(' ')),'','',section,meta.collectedAt,filename,true);
      attachInterpretation(results,previousResult,comment);
      results.push(comment);continue;
    }
    // Only result-shaped values; explanatory paragraphs never become measurements.
    if(!/^(?:[<>≤≥]?\s*-?\d|neg|poz|norm|rare|absent|prezent|camp|ser hemolizat)/i.test(value)) {warnings.push('Un rând PDF nu a fost recunoscut; verifică documentul original.');continue;}
    const parsed=splitReference(ref);
    previousResult=results.length;
    results.push(resultFromCells(name.replace(/\s*\(Tip proba:.*$/i,''),value,parsed.unit,/^[-–\s]*$/.test(parsed.reference)?'':parsed.reference,section,meta.collectedAt,filename,/ser hemolizat/i.test(value)));
  }
  if(!results.length) throw new Error('PDF fără tabel text recunoscut. PDF-urile scanate nu pot fi citite; încarcă exportul HTML sau un PDF cu text selectabil.');
  if(!meta.collectedAt) warnings.push('Data recoltării nu a fost identificată. Completeaz-o înainte de formatare.');
  if(!meta.patientKey) warnings.push('Pacient neidentificat: verifică apartenența buletinului înainte de combinare.');
  warnings.push('Verifică rezultatele extrase din PDF comparând cu originalul.');
  return {id,filename,...meta,patientKey:meta.patientKey||`unknown:${id}`,results,warnings:[...new Set(warnings)]};
}
export async function readLabFile(file: File): Promise<LabReport> {
  const id=crypto.randomUUID();
  if(file.size>25*1024*1024) throw new Error('Fișier prea mare (maximum 25 MB).');
  if(/\.html?$/i.test(file.name)) {
    const bytes=await file.arrayBuffer();
    const prefix=new TextDecoder().decode(bytes.slice(0,1024));
    const encoding=prefix.match(/charset\s*=\s*["']?([\w-]+)/i)?.[1]??'utf-8';
    return parseHtml(new TextDecoder(encoding).decode(bytes),file.name,id);
  }
  if(!/\.pdf$/i.test(file.name)) throw new Error('Format acceptat: HTML sau PDF.');
  const pdfjs=await import('pdfjs-dist');
  const worker=await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  pdfjs.GlobalWorkerOptions.workerSrc=worker.default;
  const pdf=await pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false,useSystemFonts:true}).promise;
  try {
    if(pdf.numPages>100) throw new Error('PDF prea lung (maximum 100 pagini).');
    const items:PositionedText[]=[];
    for(let p=1;p<=pdf.numPages;p++) {
      const page=await pdf.getPage(p); const content=await page.getTextContent();
      for(const item of content.items) if('str' in item && item.str.trim()) items.push({text:item.str,x:item.transform[4],y:item.transform[5],width:item.width,page:p});
    }
    return parsePdfItems(items,file.name,id);
  } finally { await pdf.destroy(); }
}
