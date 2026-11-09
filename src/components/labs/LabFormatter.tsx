import { useMemo, useRef, useState } from 'react';
import { Upload, FileText, Copy, Download, Trash2, LoaderCircle, AlertTriangle, Check, ArrowRightLeft, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LabTextEditor, type EditedLabText } from './LabTextEditor';
import { Checkbox } from '@/components/ui/checkbox';
import { formatLabs, displayDate, referenceKey, type LabReport } from '@/lib/labs/format';
import { readLabFile } from '@/lib/labs/parse';
import { templateElements, orderedReports, moveItem, transferReport } from '@/lib/labs/arrange';
import { LabSortArea, LabSortable } from './LabSortable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useWard } from '@/lib/store';

export function LabFormatter() {
  const lang=useWard(s=>s.lang); const en=lang==='en';
  const [reports,setReports]=useState<LabReport[]>([]);
  const [selected,setSelected]=useState('');
  const [busy,setBusy]=useState(false);
  const [errors,setErrors]=useState<string[]>([]);
  const [other,setOther]=useState(true);
  const [refs,setRefs]=useState(true);
  const [edited,setEdited]=useState<EditedLabText|null>(null);
  const [resetKey,setResetKey]=useState(0);
  const [excluded,setExcluded]=useState<Set<string>>(new Set());
  const [reportOrders,setReportOrders]=useState<Record<string,string[]>>({});
  const [elementOrder,setElementOrder]=useState<string[]>([]);
  const [moving,setMoving]=useState<LabReport|null>(null);
  const [target,setTarget]=useState('');
  function resetEdited() { setEdited(null); setResetKey(n=>n+1); }
  const [dragging,setDragging]=useState(false);
  const input=useRef<HTMLInputElement>(null);
  const patients=useMemo(()=>[...new Map(reports.map(r=>[r.patientKey,r.patientName])).entries()],[reports]);
  const current=orderedReports(reports.filter(r=>r.patientKey===selected),reportOrders[selected]);
  const elements=templateElements(current);
  const arrangedElements=[...elements].sort((a,b)=>{
    const ai=elementOrder.indexOf(a.id),bi=elementOrder.indexOf(b.id);
    return (ai<0?elementOrder.length+elements.indexOf(a):ai)-(bi<0?elementOrder.length+elements.indexOf(b):bi);
  });
  const missingDate=current.some(r=>!r.collectedAt);
  const generated=useMemo(()=>{ const chosen=reports.filter(r=>r.patientKey===selected); return chosen.length && chosen.every(r=>r.collectedAt)?formatLabs(chosen,other,refs,excluded,{reportOrder:reportOrders[selected]??[],elementOrder}):''; },[reports,selected,other,refs,excluded,reportOrders,elementOrder]);
  const output=edited?.text??generated;
  const formattedHtml=()=>`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Analize sistematizate</title></head><body><div style="font-family:Arial,sans-serif;font-size:10pt;line-height:1.5">${edited?.html??generated.split('\n\n').map(p=>`<p>${p.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p>`).join('')}</div></body></html>`;
  const count=current.reduce((n,r)=>n+r.results.length,0);
  async function upload(files: File[]) {
    if(busy)return;
    setBusy(true); resetEdited(); setErrors([]);
    const added:LabReport[]=[]; const failed:string[]=[];
    for(const file of files) {
      try {added.push(await readLabFile(file));} catch(error) {failed.push(`${file.name}: ${error instanceof Error?error.message:'Fișierul nu a putut fi citit.'}`);}
    }
    setReports(old=>[...old,...added]);
    const firstAdded=added[0];
    if(firstAdded)setSelected(old=>old||firstAdded.patientKey);
    setErrors(failed); setBusy(false);
    if(input.current)input.current.value='';
  }
  function save(styled=false) {
    const url=URL.createObjectURL(new Blob([styled?formattedHtml():output],{type:styled?'text/html;charset=utf-8':'text/plain;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download=styled?'analize-sistematizate.html':'analize-sistematizate.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function confirmTransfer() {
    const patient=patients.find(([key])=>key===target);
    if(!moving || !patient || moving.patientKey===target)return;
    setReports(old=>transferReport(old,moving.id,{key:patient[0],name:patient[1]}));
    setReportOrders(old=>{
      const next={...old};
      const destination=next[target];
      if(destination)next[target]=[...destination.filter(id=>id!==moving.id),moving.id];
      const source=next[moving.patientKey];
      if(source)next[moving.patientKey]=source.filter(id=>id!==moving.id);
      return next;
    });
    if(current.length===1)setSelected(target);
    resetEdited();setMoving(null);setTarget('');
    toast.success(en?'Bulletin transferred':'Buletin transferat');
  }
  return <div className="flex flex-col gap-5">
    <div className="flex flex-wrap items-end justify-between gap-3 border-b pb-4">
      <div><h1 className="text-2xl font-semibold">{en?'Laboratory results':'Formatare analize'}</h1><p className="mt-1 text-sm text-muted-foreground">{en?'HTML · PDF · Chronological results':'HTML · PDF · Rezultate în ordine cronologică'}</p></div>
      {reports.length>0 && <Button variant="ghost" onClick={()=>{setReports([]);setSelected('');resetEdited();setExcluded(new Set());setErrors([]);setReportOrders({});}} disabled={busy}><Trash2 className="h-4 w-4" />{en?'Clear files':'Șterge fișierele'}</Button>}
    </div>
    <div onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault();setDragging(false);void upload([...e.dataTransfer.files]);}} className={`flex flex-wrap items-center justify-between gap-4 border-2 border-dashed p-5 ${dragging?'border-primary bg-accent':'border-border bg-surface'}`}>
      <div className="flex min-w-0 items-center gap-3"><FileText className="h-8 w-8 shrink-0 text-primary" /><div><h2 className="font-medium">{en?'Laboratory bulletins':'Buletine de analize'}</h2><p className="text-xs text-muted-foreground">{en?'Processed only on this device. Scanned PDFs are not supported.':'Prelucrate doar pe acest dispozitiv. PDF-urile scanate nu sunt acceptate.'}</p></div></div>
      <Button disabled={busy} onClick={()=>input.current?.click()}>{busy?<LoaderCircle className="h-4 w-4 animate-spin motion-reduce:animate-none" />:<Upload className="h-4 w-4" />}{busy?(en?'Reading…':'Se citesc…'):(en?'Upload HTML / PDF':'Încarcă HTML / PDF')}</Button>
      <input ref={input} type="file" multiple accept=".html,.htm,.pdf,text/html,application/pdf" className="hidden" aria-label="Încarcă buletine" onChange={e=>{void upload([...(e.target.files??[])]);}} />
    </div>
    {errors.length>0 && <div role="alert" className="border-l-4 border-destructive bg-destructive/10 p-3 text-sm"><ul>{errors.map((err,i)=><li key={i} className="break-words">{err}</li>)}</ul></div>}
    {patients.length>0 && <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-medium">{en?'Patient':'Pacient'}</span><select aria-label="Pacient buletine" value={selected} className="max-w-full rounded-md border bg-background px-3 py-2 text-sm" onChange={e=>{setSelected(e.target.value);resetEdited();}}>{patients.map(([id,name])=><option key={id} value={id}>{name}{id.startsWith('unknown:')?' · '+reports.find(r=>r.patientKey===id)?.filename:''}</option>)}</select>{patients.length>1 && <span className="text-xs text-warning">{en?'Results are separated by patient.':'Rezultatele sunt separate pe pacienți.'}</span>}</div>}
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)]">
      <section className="min-w-0">
        <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">{en?'Source bulletins':'Buletine sursă'}</h2><span className="text-xs text-muted-foreground">{current.length} {en?'files':'fișiere'} · {count} {en?'results':'rezultate'}</span></div>
        {current.length===0 && <div className="border-y py-10 text-center text-sm text-muted-foreground">{en?'No bulletins loaded':'Niciun buletin încărcat'}</div>}
        {reportOrders[selected] && <Button variant="ghost" size="sm" className="mb-2" onClick={()=>{setReportOrders(old=>{const next={...old};delete next[selected];return next;});resetEdited();}}><RotateCcw />{en?'Chronological order':'Ordine cronologică'}</Button>}
        <LabSortArea ids={current.map(r=>r.id)} onMove={(from,to)=>{setReportOrders(old=>({...old,[selected]:moveItem(current.map(r=>r.id),from,to)}));resetEdited();}}><div className="flex flex-col divide-y border-y">{current.map(report=><LabSortable key={report.id} id={report.id} label={report.filename}>
          <div className="flex items-start gap-2"><FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><div className="min-w-0 flex-1"><p className="break-words text-sm font-medium">{report.filename}</p><p className="text-xs text-muted-foreground">{report.results.length} {en?'results':'rezultate'} · {displayDate(report.collectedAt)}</p></div><Button variant="ghost" size="icon" title={en?'Remove bulletin':'Elimină buletin'} aria-label={`Elimină ${report.filename}`} onClick={()=>{setReports(old=>old.filter(r=>r.id!==report.id));resetEdited();}}><Trash2 className="h-4 w-4" /></Button></div>
          <label className="mt-2 flex flex-wrap items-center gap-2 text-xs"><span>{en?'Collection date':'Data recoltării'}</span><Input type="datetime-local" step="1" aria-label={`Data recoltării ${report.filename}`} value={report.collectedAt} className="h-8 w-auto max-w-full bg-background text-xs" onChange={e=>{const value=e.target.value;setReports(old=>old.map(r=>r.id===report.id?{...r,collectedAt:value.length===16?value+':00':value}:r));resetEdited();}} /></label>
          {patients.length>1 && <Button variant="ghost" size="sm" className="mt-1" aria-label={`Transferă ${report.filename}`} onClick={()=>{setMoving(report);setTarget('');}}><ArrowRightLeft />{en?'Transfer to patient':'Transferă la pacient'}</Button>}
          {report.originalPatient && <p className="mt-1 text-xs text-warning">{en?'Assigned to':'Atribuit lui'} {report.patientName} · {en?'Patient in source':'Pacient în sursă'}: {report.originalPatient.name}</p>}
          {report.warnings.map((w,i)=><p key={i} className="mt-2 flex gap-1.5 text-xs text-muted-foreground"><AlertTriangle className="h-3.5 w-3.5 shrink-0 text-warning" />{w}</p>)}
          <details className="mt-2"><summary className="cursor-pointer text-xs font-medium text-primary">{en?'Extracted results':'Rezultate extrase'}</summary><div className="mt-2 max-h-72 overflow-auto"><table className="w-full text-left text-xs"><thead className="bg-surface"><tr><th className="p-1">{en?'Analysis':'Analiză'}</th><th className="p-1">{en?'Value':'Valoare'}</th><th className="p-1">UM</th><th className="p-1">{en?'Normal range':'Interval normal'}</th></tr></thead><tbody>{report.results.map((r,i)=><tr key={i} className="border-b"><td className="p-1">{r.name}</td><td className="p-1">{r.value}</td><td className="p-1">{r.unit}</td><td className="p-1">{r.reference && !r.note?<label className="flex items-center gap-2"><Checkbox aria-label={`${en?'Include normal range':'Include interval normal'} ${r.name} ${report.filename} ${i+1}`} checked={!excluded.has(referenceKey(report.id,i))} disabled={!refs} onCheckedChange={value=>{setExcluded(old=>{const next=new Set(old);const key=referenceKey(report.id,i);if(value===true)next.delete(key);else next.add(key);return next;});resetEdited();}} /><span className={!excluded.has(referenceKey(report.id,i))?'':'text-muted-foreground line-through'}>{r.reference}</span></label>:'—'}</td></tr>)}</tbody></table></div></details>
        </LabSortable>)}</div></LabSortArea>
      </section>
      <section className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">{en?'Formatted text':'Text sistematizat'}</h2><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" disabled={!output||busy} onClick={async()=>{try{if(typeof ClipboardItem!=='undefined' && navigator.clipboard.write){await navigator.clipboard.write([new ClipboardItem({'text/html':new Blob([formattedHtml()],{type:'text/html'}),'text/plain':new Blob([output],{type:'text/plain'})})]);}else{await navigator.clipboard.writeText(output);}toast.success(en?'Copied':'Text copiat');}catch{toast.error(en?'Copy unavailable':'Copiere indisponibilă');}}}><Copy className="h-4 w-4" />{en?'Copy':'Copiază'}</Button><Button variant="outline" size="sm" disabled={!output||busy} onClick={()=>save()}><Download className="h-4 w-4" />TXT</Button><Button variant="outline" size="sm" disabled={!output||busy} onClick={()=>save(true)}><Download className="h-4 w-4" />HTML</Button></div></div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs"><label className="flex items-center gap-2"><Checkbox checked={other} onCheckedChange={v=>{setOther(v===true);resetEdited();}} />{en?'Include analyses outside template':'Include analizele din afara template-ului'}</label><label className="flex items-center gap-2"><Checkbox checked={refs} onCheckedChange={v=>{setRefs(v===true);resetEdited();}} />{en?'Reference ranges from bulletins':'Valori normale din buletine'}</label></div>
        {missingDate && <p role="alert" className="text-sm text-destructive">{en?'Complete the missing collection dates.':'Completează datele de recoltare lipsă.'}</p>}
        <LabTextEditor text={generated} resetKey={resetKey} en={en} onChange={setEdited} />
        {edited!==null && <Button variant="ghost" size="sm" className="self-start" onClick={resetEdited}><Check className="h-4 w-4" />{en?'Restore generated text':'Restabilește textul generat'}</Button>}
        <details className="border-t pt-3 text-xs"><summary className="cursor-pointer font-medium text-muted-foreground">{en?'Template order':'Ordinea template-ului'}</summary><div className="mt-3"><LabSortArea capsules ids={arrangedElements.map(e=>e.id)} onMove={(from,to)=>{setElementOrder(moveItem(arrangedElements.map(e=>e.id),from,to));resetEdited();}}><div className="flex flex-wrap gap-2">{arrangedElements.map(e=><LabSortable key={e.id} id={e.id} label={e.label} capsule />)}</div></LabSortArea>{elementOrder.length>0 && <Button variant="ghost" size="sm" className="mt-2" onClick={()=>{setElementOrder([]);resetEdited();}}><RotateCcw />{en?'Default template order':'Ordinea inițială a template-ului'}</Button>}</div></details>
      </section>
    </div>
    <Dialog open={moving!==null} onOpenChange={open=>{if(!open){setMoving(null);setTarget('');}}}><DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg"><DialogHeader><DialogTitle>{en?'Transfer bulletin':'Transferă buletinul'}</DialogTitle><DialogDescription className="break-words">{moving?.filename} · {en?'From':'De la'} {moving?.patientName}. {en?'The original document stays unchanged.':'Documentul original rămâne nemodificat.'}</DialogDescription></DialogHeader><label className="flex flex-col gap-2 text-sm">{en?'Destination patient':'Pacient destinatar'}<select aria-label="Pacient destinatar" value={target} onChange={e=>setTarget(e.target.value)} className="w-full min-w-0 rounded-md border bg-background px-3 py-2"><option value="">{en?'Select patient':'Selectează pacientul'}</option>{patients.filter(([key])=>key!==moving?.patientKey).map(([key,name])=><option key={key} value={key}>{name}</option>)}</select></label><DialogFooter><Button variant="outline" onClick={()=>setMoving(null)}>{en?'Cancel':'Anulează'}</Button><Button disabled={!target} onClick={confirmTransfer}><ArrowRightLeft />{en?'Transfer':'Transferă'}</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
