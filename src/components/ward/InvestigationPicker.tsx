import { useState } from "react";
import { FlaskConical, ScanLine, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useWard } from "@/lib/store";
import { IMAGING, MODALITIES, filterImaging, imagingTask, supportsOptionalContrast } from "@/lib/imaging";
import { INVESTIGATIONS, INV_CATEGORIES } from "@/lib/ward-data";
import { tr } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function InvestigationPicker({ patientId, mode }: { patientId: string; mode: "imaging" | "lab" }) {
  const { lang, favorites, toggleFavorite, addTask } = useWard();
  const t = tr(lang);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [modality, setModality] = useState("all");
  const [region, setRegion] = useState("all");
  const [contrastByKey, setContrastByKey] = useState<Record<string, boolean>>({});
  const regions = [...new Set(IMAGING.filter(i => modality === "all" || i.modality === modality).map(i => i.region))];
  const rows = mode === "imaging" ? filterImaging(favorites, q, modality, region)
    : INVESTIGATIONS.filter(i => i.cat !== "imaging" && `${i.ro} ${i.en}`.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => Number(favorites.includes(b.key)) - Number(favorites.includes(a.key)));
  const groups = mode === "imaging"
    ? [{ title: t("favorites"), items: rows.filter(i => favorites.includes(i.key)) }, { title: t("imaging"), items: rows.filter(i => !favorites.includes(i.key)) }]
    : [{ title: t("favorites"), items: rows.filter(i => favorites.includes(i.key)) }, ...(["lab", "cardio", "endo", "other"] as const).map(cat => ({ title: INV_CATEGORIES[cat][lang], items: rows.filter(i => i.cat === cat && !favorites.includes(i.key)) }))];
  const Icon = mode === "imaging" ? ScanLine : FlaskConical;
  return <Popover open={open} onOpenChange={value => { setOpen(value); if (!value) setQ(""); }}>
    <PopoverTrigger asChild>
      <Button size="sm" variant="outline" className="gap-1.5"><Icon className="h-4 w-4 text-primary" />{t(mode === "imaging" ? "addImaging" : "addLab")}</Button>
    </PopoverTrigger>
    <PopoverContent className="flex max-h-[min(600px,var(--radix-popover-content-available-height))] w-[420px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden p-0" align="start" aria-label={t(mode === "imaging" ? "addImaging" : "addLab")}>
      <Command shouldFilter={false} className="min-h-0">
        <CommandInput value={q} onValueChange={setQ} placeholder={t("searchInvestigation")} />
        {mode === "imaging" && <div className="grid grid-cols-2 gap-2 border-b p-2">
          <Select value={modality} onValueChange={v => { setModality(v); setRegion("all"); }}><SelectTrigger className="min-w-0" aria-label={t("modality")}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{t("all")} · {t("modality")}</SelectItem>{MODALITIES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
          <Select value={region} onValueChange={setRegion}><SelectTrigger className="min-w-0" aria-label={t("region")}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{t("allRegions")}</SelectItem>{regions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select>
        </div>}
        <CommandList className="min-h-0 max-h-80" aria-label={t(mode === "imaging" ? "imaging" : "laboratory")}>
          <CommandEmpty>{t("noResults")}</CommandEmpty>
          {groups.filter(group => group.items.length > 0).map(group => <CommandGroup key={group.title} heading={group.title}>
            {group.items.map(i => {
              const favorite = favorites.includes(i.key);
              const im = IMAGING.find(item => item.key === i.key);
              const contrast = contrastByKey[i.key] ?? false;
              const optionalContrast = im && supportsOptionalContrast(im);
              return <CommandItem key={i.key} value={i.key} className="cursor-pointer" onSelect={() => {
                addTask(patientId, im ? imagingTask(im, contrast) : { kind: "investigation", key: i.key, label: i[lang], status: "pending" });
                setOpen(false); setQ("");
              }}>
                <Icon className="text-primary" />
                <div className="min-w-0 flex-1"><p className="break-words font-medium">{i[lang]}</p>{im && <p className="break-words text-xs text-muted-foreground">{im.modality} · {im.region}{optionalContrast ? ` · ${t(contrast ? "withContrast" : "withoutContrast")}` : ""}</p>}</div>
                {optionalContrast && <div className="flex shrink-0 flex-col items-center gap-1" onClick={e => e.stopPropagation()} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") e.stopPropagation(); }}>
                  <span className="text-xs text-muted-foreground">{t("contrast")}</span>
                  <Switch checked={contrast} onCheckedChange={checked => setContrastByKey(current => ({ ...current, [i.key]: checked }))} aria-label={`${t("contrast")}: ${i[lang]}`} title={t(contrast ? "withContrast" : "withoutContrast")} />
                </div>}
                <Button variant="ghost" size="icon" className={cn("h-7 w-7 shrink-0", favorite && "text-warning")} title={t(favorite ? "favoriteRemove" : "favoriteAdd")} aria-label={`${t(favorite ? "favoriteRemove" : "favoriteAdd")}: ${i[lang]}`} aria-pressed={favorite} onClick={e => { e.stopPropagation(); toggleFavorite(i.key); }} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") e.stopPropagation(); }}><Star className={cn("h-4 w-4", favorite && "fill-current")} /></Button>
              </CommandItem>;
            })}
          </CommandGroup>)}
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>;
}
