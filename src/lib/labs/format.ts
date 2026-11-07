import { clean, normalize, nameFor, templateRank, TEMPLATE } from './catalog';
export type LabResult = { name: string; rawName: string; value: string; unit: string; reference: string; section: 'blood' | 'urine' | 'smear'; date: string; source: string; note?: boolean };
export type LabReport = { id: string; filename: string; patientKey: string; patientName: string; collectedAt: string; results: LabResult[]; warnings: string[] };
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
  // Only count units explicitly written as 10^3 are converted. Never guess a multiplier.
  const count = /^(?:[<>≤≥]\s*)?\d+(?:[.,]\d+)?$/.test(value);
  if ((name==='Leucocite' || name==='Trombocite') && count && /10\s*\^?\s*3\s*\/\s*[µμu]l/i.test(unit)) {
    value=value.replace(/\d+(?:[.,]\d+)?/, n=> String(Math.round(Number(n.replace(',','.'))*1000)));
    unit='/µL';
  }
  const trailing = value.match(/^([<>≤≥]?\s*\d+(?:[.,]\d+)?)\s+(.+)$/);
  if (trailing?.[1] && trailing[2] && /^(?:mg|g|mmol|µmol|ng|pg|[µμu]g|[µμu]i?u|u|ui|iu|leu|ery|%|\/)/i.test(trailing[2])) { value=trailing[1]; unit=trailing[2]; }
  if (section==='urine') value = normalize(value)==='neg' ? 'negativ' : normalize(value)==='norm' ? 'normal' : value;
  return {name, rawName:clean(rawName), value, unit, reference:clean(reference), section,date,source, note};
}
export function deduplicate(results: LabResult[]) {
  const seen=new Set<string>();
  return results.filter(r=>{ const key=JSON.stringify([r.section,r.date,normalize(r.name),r.value,normalize(r.unit),r.reference,!!r.note]); if(seen.has(key)) return false; seen.add(key); return true; });
}
const referenceNames = new Set(['Calciu seric total','Fosfor seric','Acid folic','Vitamina B12','FT4','TSH','ANA SCREEN','Anti dsDNA IgG','ASLO cantitativ','Imunoglobulina A','Imunoglobulina M','Imunoglobulina G','Complement C3','Complement C4','Anticorpi totali anti-Treponema pallidum','AFP','CA 19-9','Antigen Carcinoembrionar','PSA','Parathormon']);
export function formatLabs(reports: LabReport[], includeOther = true, includeReferences = true): string {
  if (new Set(reports.map(r=>r.patientKey)).size>1) throw new Error('Buletinele unor pacienți diferiți nu pot fi combinate.');
  if (reports.some(r=>!r.collectedAt)) throw new Error('Completează data recoltării pentru fiecare buletin.');
  const results=deduplicate(reports.flatMap(report=>report.results.map(r=>({...r,date:report.collectedAt})))).sort((a,b)=>a.date.localeCompare(b.date));
  const blood=results.filter(r=>r.section==='blood' && !r.note);
  const groups=new Map<string,LabResult[]>();
  for(const r of blood) {
    if(!includeOther && templateRank(r.name)>=TEMPLATE.length) continue;
    // Different units or reference ranges remain distinct, never collapsed into misleading series.
    const key=JSON.stringify([r.name,normalize(r.unit),r.reference]);
    groups.set(key,[...(groups.get(key)??[]),r]);
  }
  const entries=[...groups.values()].sort((a,b)=>templateRank(a[0]?.name??'')-templateRank(b[0]?.name??''));
  const rendered=entries.map(g=>{
    const r=g[0]; if(!r)return ''; const joined=g.map(x=>/[<>≤≥]|\d-\d/.test(x.value)?`(${x.value})`:x.value).join('-');
    const ref=includeReferences && referenceNames.has(r.name) && r.reference?` (VN: ${r.reference}${r.unit?' '+r.unit:''})`:'';
    return `${r.name} ${joined}${r.unit?' '+r.unit:''}${ref}`;
  });
  const lines=rendered.length ? [`Hemograma: ${rendered.join(', ')}.`] : [];
  for(const section of ['urine','smear'] as const) {
    const dates=[...new Set(results.filter(r=>r.section===section).map(r=>r.date))];
    for(const date of dates) {
      const rows=results.filter(r=>r.section===section && r.date===date && !r.note);
      if(rows.length) lines.push(`${section==='urine'?'Examen Sumar de Urina':'Frotiu Sangvin'} (${displayDate(date)}): ${rows.map(r=>`${/^sediment/i.test(r.rawName)?'Sediment – ':''}${r.name} ${r.value}${r.unit?' '+r.unit:''}`).join(', ')}.`);
    }
  }
  const notes=results.filter(r=>r.note);
  if(notes.length) lines.push(`Observații probe: ${notes.map(r=>`${r.name} (${displayDate(r.date)}): ${r.value}`).join('; ')}.`);
  return lines.join('\n\n');
}
