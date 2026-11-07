import { useMemo, useRef, useState } from 'react';
import { Upload, FileText, Copy, Download, Trash2, LoaderCircle, AlertTriangle, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { formatLabs, displayDate, type LabReport } from '@/lib/labs/format';
import { readLabFile } from '@/lib/labs/parse';
import { TEMPLATE, templateRank } from '@/lib/labs/catalog';
import { useWard } from '@/lib/store';

export function LabFormatter() {
  const lang=useWard(s=>s.lang); const en=lang==='en';
  const [reports,setReports]=useState<LabReport[]>([]);
  const [selected,setSelected]=useState('');
  const [busy,setBusy]=useState(false);
  const [errors,setErrors]=useState<string[]>([]);
  const [other,setOther]=useState(true);
  const [refs,setRefs]=useState(true);
  const [edited,setEdited]=useState<string|null>(null);
  const [dragging,setDragging]=useState(false);
  const input=useRef<HTMLInputElement>(null);
  const patients=useMemo(()=>[...new Map(reports.map(r=>[r.patientKey,r.patientName])).entries()],[reports]);
  const current=reports.filter(r=>r.patientKey===selected).sort((a,b)=>a.collectedAt.localeCompare(b.collectedAt));
  const missingDate=current.some(r=>!r.collectedAt);
  const generated=useMemo(()=>{ const chosen=reports.filter(r=>r.patientKey===selected); return chosen.length && chosen.every(r=>r.collectedAt)?formatLabs(chosen,other,refs):''; },[reports,selected,other,refs]);
  const output=edited??generated;
  const count=current.reduce((n,r)=>n+r.results.length,0);
  async function upload(files: File[]) {
    if(busy)return;
    setBusy(true); setEdited(null); setErrors([]);
    const added:LabReport[]=[]; const failed:string[]=[];
    for(const file of files) {
      try {added.push(await readLabFile(file));} catch(error) {failed.push(`${file.name}: ${error instanceof Error?error.message:'Fișierul nu a putut fi citit.'}`);}
    }
    setReports(old=>[...old,...added]);
    if(added[0])setSelected(old=>old||added[0].patientKey);
    setErrors(failed); setBusy(false);
    if(input.current)input.current.value='';
  }
  function save() {
    const url=URL.createObjectURL(new Blob([output],{type:'text/plain;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download='analize-sistematizate.txt';a.click();URL.revokeObjectURL(url);
  }
  return <div className="flex flex-col gap-5">
    <div className="flex flex-wrap items-end justify-between gap-3 border-b pb-4">
      <div><h1 className="text-2xl font-semibold">{en?'Laboratory results':'Formatare analize'}</h1><p className="mt-1 text-sm text-muted-foreground">{en?'HTML · PDF · Chronological results':'HTML · PDF · Rezultate în ordine cronologică'}</p></div>
      {reports.length>0 && <Button variant="ghost" onClick={()=>{setReports([]);setSelected('');setEdited(null);setErrors([]);}} disabled={busy}><Trash2 className="h-4 w-4" />{en?'Clear files':'Șterge fișierele'}</Button>}
    </div>
    <div onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault();setDragging(false);void upload([...e.dataTransfer.files]);}} className={`flex flex-wrap items-center justify-between gap-4 border-2 border-dashed p-5 ${dragging?'border-primary bg-accent':'border-border bg-surface'}`}>
      <div className="flex min-w-0 items-center gap-3"><FileText className="h-8 w-8 shrink-0 text-primary" /><div><h2 className="font-medium">{en?'Laboratory bulletins':'Buletine de analize'}</h2><p className="text-xs text-muted-foreground">{en?'Processed only on this device. Scanned PDFs are not supported.':'Prelucrate doar pe acest dispozitiv. PDF-urile scanate nu sunt acceptate.'}</p></div></div>
      <Button disabled={busy} onClick={()=>input.current?.click()}>{busy?<LoaderCircle className="h-4 w-4 animate-spin motion-reduce:animate-none" />:<Upload className="h-4 w-4" />}{busy?(en?'Reading…':'Se citesc…'):(en?'Upload HTML / PDF':'Încarcă HTML / PDF')}</Button>
      <input ref={input} type="file" multiple accept=".html,.htm,.pdf,text/html,application/pdf" className="hidden" aria-label="Încarcă buletine" onChange={e=>{void upload([...(e.target.files??[])]);}} />
    </div>
    {errors.length>0 && <div role="alert" className="border-l-4 border-destructive bg-destructive/10 p-3 text-sm"><ul>{errors.map((err,i)=><li key={i} className="break-words">{err}</li>)}</ul></div>}
    {patients.length>0 && <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-medium">{en?'Patient':'Pacient'}</span><select aria-label="Pacient buletine" value={selected} className="max-w-full rounded-md border bg-background px-3 py-2 text-sm" onChange={e=>{setSelected(e.target.value);setEdited(null);}}>{patients.map(([id,name])=><option key={id} value={id}>{name}{id.startsWith('unknown:')?' · '+reports.find(r=>r.patientKey===id)?.filename:''}</option>)}</select>{patients.length>1 && <span className="text-xs text-warning">{en?'Results are separated by patient.':'Rezultatele sunt separate pe pacienți.'}</span>}</div>}
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)]">
      <section className="min-w-0">
        <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">{en?'Source bulletins':'Buletine sursă'}</h2><span className="text-xs text-muted-foreground">{current.length} {en?'files':'fișiere'} · {count} {en?'results':'rezultate'}</span></div>
        {current.length===0 && <div className="border-y py-10 text-center text-sm text-muted-foreground">{en?'No bulletins loaded':'Niciun buletin încărcat'}</div>}
        <div className="flex flex-col divide-y border-y">{current.map(report=><div key={report.id} className="min-w-0 py-3">
          <div className="flex items-start gap-2"><FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><div className="min-w-0 flex-1"><p className="break-words text-sm font-medium">{report.filename}</p><p className="text-xs text-muted-foreground">{report.results.length} {en?'results':'rezultate'} · {displayDate(report.collectedAt)}</p></div><Button variant="ghost" size="icon" title={en?'Remove bulletin':'Elimină buletin'} aria-label={`Elimină ${report.filename}`} onClick={()=>{setReports(old=>old.filter(r=>r.id!==report.id));setEdited(null);}}><Trash2 className="h-4 w-4" /></Button></div>
          <label className="mt-2 flex flex-wrap items-center gap-2 text-xs"><span>{en?'Collection date':'Data recoltării'}</span><Input type="datetime-local" step="1" aria-label={`Data recoltării ${report.filename}`} value={report.collectedAt} className="h-8 w-auto max-w-full bg-background text-xs" onChange={e=>{const value=e.target.value;setReports(old=>old.map(r=>r.id===report.id?{...r,collectedAt:value.length===16?value+':00':value}:r));setEdited(null);}} /></label>
          {report.warnings.map((w,i)=><p key={i} className="mt-2 flex gap-1.5 text-xs text-muted-foreground"><AlertTriangle className="h-3.5 w-3.5 shrink-0 text-warning" />{w}</p>)}
          <details className="mt-2"><summary className="cursor-pointer text-xs font-medium text-primary">{en?'Extracted results':'Rezultate extrase'}</summary><div className="mt-2 max-h-72 overflow-auto"><table className="w-full text-left text-xs"><thead className="bg-surface"><tr><th className="p-1">{en?'Analysis':'Analiză'}</th><th className="p-1">{en?'Value':'Valoare'}</th><th className="p-1">UM</th></tr></thead><tbody>{report.results.map((r,i)=><tr key={i} className="border-b"><td className="p-1">{r.name}</td><td className="p-1">{r.value}</td><td className="p-1">{r.unit}</td></tr>)}</tbody></table></div></details>
        </div>)}</div>
      </section>
      <section className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">{en?'Formatted text':'Text sistematizat'}</h2><div className="flex gap-2"><Button variant="outline" size="sm" disabled={!output||busy} onClick={async()=>{try{await navigator.clipboard.writeText(output);toast.success(en?'Copied':'Text copiat');}catch{toast.error(en?'Copy unavailable':'Copiere indisponibilă');}}}><Copy className="h-4 w-4" />{en?'Copy':'Copiază'}</Button><Button variant="outline" size="sm" disabled={!output||busy} onClick={save}><Download className="h-4 w-4" />TXT</Button></div></div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs"><label className="flex items-center gap-2"><Checkbox checked={other} onCheckedChange={v=>{setOther(v===true);setEdited(null);}} />{en?'Include analyses outside template':'Include analizele din afara template-ului'}</label><label className="flex items-center gap-2"><Checkbox checked={refs} onCheckedChange={v=>{setRefs(v===true);setEdited(null);}} />{en?'Template reference ranges':'Valori normale din template'}</label></div>
        {missingDate && <p role="alert" className="text-sm text-destructive">{en?'Complete the missing collection dates.':'Completează datele de recoltare lipsă.'}</p>}
        <Textarea aria-label="Text sistematizat" value={output} onChange={e=>setEdited(e.target.value)} placeholder={en?'Formatted results':'Rezultatele formatate'} className="min-h-96 resize-y bg-card font-mono text-sm leading-6" />
        {edited!==null && <Button variant="ghost" size="sm" className="self-start" onClick={()=>setEdited(null)}><Check className="h-4 w-4" />{en?'Restore generated text':'Restabilește textul generat'}</Button>}
        <details className="border-t pt-3 text-xs"><summary className="cursor-pointer font-medium text-muted-foreground">{en?'Template order':'Ordinea template-ului'}</summary><p className="mt-2 leading-5 text-muted-foreground">{TEMPLATE.map(([label])=>label).join(' · ')}</p></details>
      </section>
    </div>
  </div>;
}
