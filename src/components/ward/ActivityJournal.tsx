import { useState } from "react";
import { History, Search } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useWard } from "@/lib/store";
import { tr, type TKey } from "@/lib/i18n";

const fieldLabels: Record<string, TKey> = { name: "name", age: "age", bed: "bed", fo: "fo", diagnosis: "diagnosis", admitted: "admitted", discharge: "dischargeDate", dischargedAt: "discharge", status: "status", date: "date", contrast: "contrast", note: "note", label: "label" };
export function ActivityJournal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { activity, lang } = useWard();
  const [q, setQ] = useState("");
  const t = tr(lang);
  const fieldLabel = (field: string) => { const key = fieldLabels[field]; return key ? t(key) : field; };
  const value = (field: string, text: string) => field === "status" && ["pending", "scheduled", "done"].includes(text) ? t(text as "pending" | "scheduled" | "done") : field === "contrast" && text ? t(text === "true" ? "withContrast" : "withoutContrast") : text || "—";
  const rows = [...activity].reverse().filter(e => `${e.patientName ?? ""} ${e.subject ?? ""} ${t(e.action)} ${e.changes.map(c => `${c.before} ${c.after}`).join(" ")}`.toLowerCase().includes(q.toLowerCase()));
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="flex max-h-[85dvh] w-[calc(100%-2rem)] max-w-2xl flex-col" aria-describedby={undefined}>
    <DialogTitle className="flex items-center gap-2"><History className="h-5 w-5 text-primary" />{t("journal")}</DialogTitle>
    <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder={t("searchActivity")} value={q} onChange={e=>setQ(e.target.value)} /></div>
    <ol className="min-h-0 overflow-y-auto divide-y">
      {rows.map(e => <li key={e.id} className="py-3"><div className="flex flex-wrap items-baseline justify-between gap-1"><p className="text-sm font-semibold">{t(e.action)}</p><time dateTime={e.at} className="text-xs text-muted-foreground">{new Date(e.at).toLocaleString(lang === "ro" ? "ro-RO" : "en-GB")}</time></div><p className="break-words text-sm">{e.patientName}{e.patientName && e.subject ? " · " : ""}{e.subject}</p>{e.changes.map((c,index) => <p key={index} className="break-words text-xs text-muted-foreground">{fieldLabel(c.field)}: {value(c.field,c.before)} → {value(c.field,c.after)}</p>)}</li>)}
      {!rows.length && <li className="py-8 text-center text-sm text-muted-foreground">{t("noActivity")}</li>}
    </ol>
  </DialogContent></Dialog>;
}