import { createFileRoute, Link } from '@tanstack/react-router';
import { Activity, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LabFormatter } from '@/components/labs/LabFormatter';
import { useWard } from '@/lib/store';
import { useEffect } from 'react';
export const Route = createFileRoute('/analize')({
  head:()=>({meta:[
    {title:'Med Pubs — formatare buletine de analize'},
    {name:'description',content:'Formatarea locală a buletinelor HTML și PDF în text sistematizat, cu rezultate în ordine cronologică, fără AI.'},
    {property:'og:title',content:'Med Pubs — formatare buletine de analize'},
    {property:'og:description',content:'Buletine de laborator transformate algoritmic în liste text cronologice.'},
    {property:'og:type',content:'website'}, {name:'twitter:card',content:'summary_large_image'},
  ]}),
  component:LabPage,
});
function LabPage(){
  const lang=useWard(s=>s.lang);
  useEffect(()=>{void useWard.persist.rehydrate();},[]);
  return <div className="min-h-screen"><header className="border-b bg-card"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3"><Link to="/" className="flex items-center gap-2 text-xl font-semibold"><span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground"><Activity className="h-4 w-4" /></span>Med Pubs</Link><Button asChild variant="outline" size="sm"><Link to="/"><ArrowLeft className="h-4 w-4" />{lang==='en'?'Patients':'Pacienți'}</Link></Button></div></header><main className="mx-auto max-w-7xl px-4 py-6"><LabFormatter /></main></div>;
}
