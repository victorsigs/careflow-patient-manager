import { clean, normalize, nameFor, templateRank, TEMPLATE } from './catalog';
import { elementKey, orderedReports, sectionKey } from './arrange';
export type LabResult = { name: string; rawName: string; value: string; unit: string; reference: string; referenceUnit?: string; section: 'blood' | 'urine' | 'smear'; date: string; source: string; note?: boolean };
export type LabReport = { id: string; filename: string; patientKey: string; patientName: string; originalPatient?: { key: string; name: string }; collectedAt: string; results: LabResult[]; warnings: string[] };
const months: Record<string, string> = { jan:'01', ian:'01', feb:'02', mar:'03', apr:'04', may:'05', mai:'05', jun:'06', iun:'06', jul:'07', iul:'07', aug:'08', sep:'09', oct:'10', nov:'11', dec:'12' };
export function parseDate(input: string): string {
  const s = normalize(input);
  const textual = s.match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  const numeric = s.match(/(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  const iso = s.match(/(\d{4})-(\d{2})-(\d{2})(?:[t\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  let y='', m='', d='', h='00', min='00', sec='00';
  if (textual) { d=textual[1]??''; m=months[(textual[2]??'').slice(0,3)] ?? ''; y=textual[3]??''; h=textual[4]??h; min=textual[5]??min; sec=textual[6]??sec; }
  else if (numeric) { d=numeric[1]??''; m=numeric[2]??''; y=numeric[3]??''; h=numeric[4]??h; min=numeric[5]??min; sec=numeric[6]??sec; }
  else if (iso) { y=iso[1]??''; m=iso[2]??''; d=iso[3]??''; h=iso[4]??h; min=iso[5]??min; sec=iso[6]??sec; }
  if (!m || !y) return '';
  const value=`${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}T${h.padStart(2,'0')}:${min}:${sec}`;
  const date = new Date(`${value}Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0,19)!==value ? '' : value;
}
export function displayDate(s: string) { if (!s) return 'Dată lipsă'; const [date='',time] = s.split('T'); return `${date.split('-').reverse().join('.')}${time ? ' '+time.slice(0,5) : ''}`; }
export function resultFromCells(rawName: string, rawValue: string, rawUnit: string, reference: string, section: LabResult['section'], date: string, source: string, note = false): LabResult {
  const name = nameFor(rawName, section);
  let value = clean(rawValue), unit=clean(rawUnit);
  const referenceUnit=unit;
  // Only count units explicitly written as 10^3 are converted. Never guess a multiplier.
  const count = /^(?:[<>≤≥]\s*)?\d+(?:[.,]\d+)?$/.test(value);
  if ((name==='Leucocite' || name==='Trombocite') && count && /10\s*\^?\s*3\s*\/\s*[µμu]l/i.test(unit)) {
    value=value.replace(/\d+(?:[.,]\d+)?/, n=> String(Math.round(Number(n.replace(',','.'))*1000)));
    unit='/µL';
  }
  const trailing = value.match(/^([<>≤≥]?\s*\d+(?:[.,]\d+)?)\s+(.+)$/);
  if (trailing?.[1] && trailing[2] && /^(?:mg|g|mmol|µmol|ng|pg|[µμu]g|[µμu]i?u|u|ui|iu|leu|ery|%|\/)/i.test(trailing[2])) { value=trailing[1]; unit=trailing[2]; }
  if (section==='urine') value = normalize(value)==='neg' ? 'negativ' : normalize(value)==='norm' ? 'normal' : value;
  return {name, rawName:clean(rawName), value, unit, reference:clean(reference), ...(referenceUnit!==unit?{referenceUnit}:{}), section,date,source, note};
}
export function deduplicate<T extends LabResult>(results: T[]): T[] {
  const seen=new Set<string>();
  return results.filter(r=>{ const key=JSON.stringify([r.section,r.date,normalize(r.name),r.value,normalize(r.unit),r.reference,r.referenceUnit??r.unit,!!r.note]); if(seen.has(key)) return false; seen.add(key); return true; });
}
export function referenceKey(reportId: string, resultIndex: number) { return JSON.stringify([reportId, resultIndex]); }
export type LabSegment = { text: string; bold?: boolean; underline?: boolean };
const num=(s:string)=>{const m=s.replace(',','.').match(/-?\d+(?:\.\d+)?/);return m?Number(m[0]):NaN;};
export function isPathological(value: string, reference: string): boolean {
  const ref=clean(reference).replace(/,/g,'.'); const v=clean(value);
  if(!ref || !v) return false;
  const range=ref.match(/^(-?\d+(?:\.\d+)?)\s*[-–]\s*(-?\d+(?:\.\d+)?)/);
  const x=num(v.replace(/^[<>≤≥]\s*/,''));
  if(range && !Number.isNaN(x) && /^[<>≤≥]?\s*-?\d/.test(v)) return x<Number(range[1]) || x>Number(range[2]);
  const upper=ref.match(/^(?:<|≤|<=|sub)\s*(\d+(?:\.\d+)?)/i); if(upper && !Number.isNaN(x) && /^[<>≤≥]?\s*\d/.test(v)) return /^[<≤]/.test(v)?false:x>Number(upper[1]);
  const lower=ref.match(/^(?:>|≥|>=|peste)\s*(\d+(?:\.\d+)?)/i); if(lower && !Number.isNaN(x) && /^[<>≤≥]?\s*\d/.test(v)) return /^[>≥]/.test(v)?false:x<Number(lower[1]);
  if(/^(negativ|neg|absent|absente)$/.test(normalize(ref))) return !/^(negativ|neg|absent|absente|normal|norm)$/.test(normalize(v));
  return false;
}
export const DEFAULT_HIDDEN_REFERENCES = ['Leucocite','Hemoglobină','Hematocrit','Trombocite','VSH','PCR','INR','Procalcitonina','GOT','GPT','Creatinina','eRFG','Glicemie','Sodiu','Potasiu','Uree','Bilirubina totala','Bilirubina directa','Gama GT','LDH','Colesterol total','LDL colesterol','HbA1c','Trigliceride'];
export function defaultExcludedReferences(report: LabReport): string[] {
  return report.results.flatMap((r,i)=>r.section==='blood' && DEFAULT_HIDDEN_REFERENCES.includes(r.name) ? [referenceKey(report.id,i)] : []);
}
export function formatLabs(...args: Parameters<typeof formatLabsDocument>): string { return formatLabsDocument(...args).map(p=>p.map(s=>s.text).join('')).join('\n\n'); }
export function formatLabsDocument(reports: LabReport[], includeOther = true, includeReferences = true, excludedReferences: ReadonlySet<string> = new Set(), arrangement: { reportOrder?: readonly string[]; elementOrder?: readonly string[] } = {}, underlinePathological = false): LabSegment[][] {
  if (new Set(reports.map(r=>r.patientKey)).size>1) throw new Error('Buletinele unor pacienți diferiți nu pot fi combinate.');
  if (reports.some(r=>!r.collectedAt)) throw new Error('Completează data recoltării pentru fiecare buletin.');
  const results=deduplicate(orderedReports(reports, arrangement.reportOrder).flatMap(report=>report.results.map((r,i)=>({...r,date:report.collectedAt,hideReference:excludedReferences.has(referenceKey(report.id,i))}))));
  const positions = new Map((arrangement.elementOrder ?? []).map((id, i) => [id, i]));
  const rank = (section: string, name: string) => positions.get(elementKey(section, name)) ?? (positions.size + templateRank(name));
  const referenceText=(r:LabResult & {hideReference:boolean})=>{const unit=r.referenceUnit??r.unit;return includeReferences && !r.hideReference && r.reference?` (VN: ${r.reference}${unit?' '+unit:''})`:'';};
  const blood=results.filter(r=>r.section==='blood' && !r.note);
  const groups=new Map<string,typeof results>();
  for(const r of blood) {
    if(!includeOther && templateRank(r.name)>=TEMPLATE.length) continue;
    // A series shares an analysis and measurement unit; references belong to individual results.
    const key=JSON.stringify([r.name,normalize(r.unit)]);
    groups.set(key,[...(groups.get(key)??[]),r]);
  }
  const entries=[...groups.values()].sort((a,b)=>rank('blood',a[0]?.name??'')-rank('blood',b[0]?.name??''));
  const val=(x:LabResult,text:string):LabSegment=>({text,...(underlinePathological && isPathological(x.value,x.reference)?{underline:true}:{})});
  const join=(parts:LabSegment[][],sep:string)=>parts.flatMap((p,i)=>i?[{text:sep},...p]:p);
  const rendered=entries.flatMap(g=>{
    const r=g[0]; if(!r)return [];
    const sharedReference=g.every(x=>referenceText(x)===referenceText(r));
    const values=join(g.map(x=>[val(x,/[<>≤≥]|\d-\d/.test(x.value)?`(${x.value})`:x.value),...(!sharedReference && referenceText(x)?[{text:referenceText(x)}]:[])]),'-');
    return [[{text:r.name,bold:true},{text:' '},...values,{text:`${r.unit?' '+r.unit:''}${sharedReference?referenceText(r):''}`}]];
  });
  const lines: {section:string; segs:LabSegment[]}[]=rendered.length ? [{section:'blood',segs:[{text:'Probe serice:',bold:true},{text:' '},...join(rendered,', '),{text:'.'}]}] : [];
  for(const section of ['urine','smear'] as const) {
    const dates=[...new Set(results.filter(r=>r.section===section).map(r=>r.date))];
    for(const date of dates) {
      const rows=results.filter(r=>r.section===section && r.date===date && !r.note).sort((a,b)=>rank(section,a.name)-rank(section,b.name));
      if(rows.length) lines.push({section,segs:[{text:`${section==='urine'?'Examen Sumar de Urina':'Frotiu Sangvin'} (${displayDate(date)}): `},...join(rows.map(r=>[{text:`${/^sediment/i.test(r.rawName)?'Sediment – ':''}${r.name}`,bold:true},{text:' '},val(r,r.value),{text:`${r.unit?' '+r.unit:''}${referenceText(r)}`}]),', '),{text:'.'}]});
    }
  }
  const notes=results.filter(r=>r.note).sort((a,b)=>rank('notes',a.name)-rank('notes',b.name));
  if(notes.length) lines.push({section:'notes',segs:[{text:'Observații probe: '},...join(notes.map(r=>[{text:`${r.name} (${displayDate(r.date)}):`,bold:true},{text:` ${r.value}`}]),'; '),{text:'.'}]});
  const defaults = ['blood','urine','smear','notes'];
  return lines.sort((a,b)=>(positions.get(sectionKey(a.section)) ?? positions.size+defaults.indexOf(a.section))-(positions.get(sectionKey(b.section)) ?? positions.size+defaults.indexOf(b.section))).map(line=>line.segs);
}
