import { useState } from "react";
import { Check, Plus, Search, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useWard } from "@/lib/store";
import { IMAGING, MODALITIES, filterImaging, imagingTask } from "@/lib/imaging";
import { INVESTIGATIONS, INV_CATEGORIES } from "@/lib/ward-data";
import { tr } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function InvestigationPicker({ patientId, open, onOpenChange }: { patientId: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { lang, favorites, toggleFavorite, addTask } = useWard();
  const t = tr(lang);
  const [mode, setMode] = useState("imaging");
  const [q, setQ] = useState("");
  const [modality, setModality] = useState("all");
  const [region, setRegion] = useState("all");
  const [contrast, setContrast] = useState(false);
  const [added, setAdded] = useState<string[]>([]);
  const regions = [...new Set(IMAGING.filter(i => modality === "all" || i.modality === modality).map(i => i.region))];
  const imaging = filterImaging(favorites, q, modality, region);
  const others = INVESTIGATIONS.filter(i => i.cat !== "imaging" && `${i.ro} ${i.en}`.toLowerCase().includes(q.toLowerCase())).sort((a,b) => Number(favorites.includes(b.key)) - Number(favorites.includes(a.key)));
  const rows = mode === "imaging" ? imaging : others;
  return <Dialog open={open} onOpenChange={o => { if (!o) setAdded([]); onOpenChange(o); }}>
    <DialogContent className="flex max-h-[90dvh] w-[calc(100%-2rem)] max-w-3xl flex-col gap-3 p-4 sm:p-6" aria-describedby={undefined}>
      <DialogTitle>{t("addInvestigations")}</DialogTitle>
      <ToggleGroup type="single" value={mode} onValueChange={v => { if (v) { setMode(v); setQ(""); } }} variant="outline" className="justify-start">
        <ToggleGroupItem value="imaging">{t("imaging")}</ToggleGroupItem>
        <ToggleGroupItem value="other">{t("otherInvestigations")}</ToggleGroupItem>
      </ToggleGroup>
      <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input autoFocus className="pl-9" value={q} onChange={e => setQ(e.target.value)} placeholder={t("searchInvestigation")} /></div>
      {mode === "imaging" && <div className="grid min-w-0 gap-2 sm:grid-cols-2">
        <Select value={modality} onValueChange={v => { setModality(v); setRegion("all"); }}><SelectTrigger aria-label={t("modality")}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{t("all")} · {t("modality")}</SelectItem>{MODALITIES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
        <Select value={region} onValueChange={setRegion}><SelectTrigger aria-label={t("region")}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{t("allRegions")}</SelectItem>{regions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select>
      </div>}
      {mode === "imaging" && (modality === "RMN" || modality === "all") && <ToggleGroup type="single" value={contrast ? "with" : "without"} onValueChange={v => v && setContrast(v === "with")} variant="outline" className="flex-wrap justify-start">
        <ToggleGroupItem value="without">RMN · {t("withoutContrast")}</ToggleGroupItem><ToggleGroupItem value="with">RMN · {t("withContrast")}</ToggleGroupItem>
      </ToggleGroup>}
      <div className="min-h-0 flex-1 overflow-y-auto border-t" role="list" aria-label={t("investigations")}>
        {!rows.length && <p className="p-6 text-center text-sm text-muted-foreground">{t("noResults")}</p>}
        {rows.map((i, index) => {
          const favorite = favorites.includes(i.key);
          const previousFavorite = index > 0 && favorites.includes(rows[index - 1]?.key ?? "");
          const im = "modality" in i ? i : undefined;
          return <div key={i.key}>
            {index === 0 && favorite && <h3 className="bg-surface px-2 py-2 text-xs font-semibold text-primary">{t("favorites")}</h3>}
            {(index === 0 && !favorite || previousFavorite && !favorite) && <h3 className="bg-surface px-2 py-2 text-xs font-semibold text-muted-foreground">{t("investigations")} · {rows.filter(r => !favorites.includes(r.key)).length}</h3>}
            <div role="listitem" className="flex min-w-0 items-center gap-2 border-b py-2">
              <Button variant="ghost" size="icon" className={cn("h-8 w-8 shrink-0", favorite && "text-warning")} title={t(favorite ? "favoriteRemove" : "favoriteAdd")} aria-label={`${t(favorite ? "favoriteRemove" : "favoriteAdd")}: ${i[lang]}`} aria-pressed={favorite} onClick={() => toggleFavorite(i.key)}><Star className={cn("h-4 w-4", favorite && "fill-current")} /></Button>
              <div className="min-w-0 flex-1"><p className="break-words text-sm font-medium">{i[lang]}</p><p className="text-xs text-muted-foreground">{im ? `${im.modality} · ${im.region}` : INV_CATEGORIES[i.cat][lang]}{im?.modality === "RMN" ? ` · ${t(contrast ? "withContrast" : "withoutContrast")}` : ""}</p></div>
              <Button size="icon" variant="outline" className="h-8 w-8 shrink-0" title={t("addInvestigations")} aria-label={`${t("addInvestigations")}: ${i[lang]}`} onClick={() => { addTask(patientId, im ? imagingTask(im, contrast) : { kind: "investigation", key: i.key, label: i[lang], status: "pending" }); setAdded(a => [...a, i.key]); }}><Plus className="h-4 w-4" /></Button>
            </div>
          </div>;
        })}
      </div>
      <div className="flex items-center justify-between border-t pt-3"><span role="status" className="flex items-center gap-1 text-sm text-primary">{added.length > 0 && <><Check className="h-4 w-4" />{t("added")}: {added.length}</>}</span><Button onClick={() => onOpenChange(false)}>{t("done")}</Button></div>
    </DialogContent>
  </Dialog>;
}