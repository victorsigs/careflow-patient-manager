import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Plus, Search, Upload, Activity, History, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useWard } from "@/lib/store";
import { tr } from "@/lib/i18n";
import { dischargeState, todayISO, type Patient } from "@/lib/patients";
import { PatientCard } from "@/components/ward/PatientCard";
import { PatientDialog } from "@/components/ward/PatientDialog";
import { ActivityJournal } from "@/components/ward/ActivityJournal";
import { parseBackup } from "@/lib/backup";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Med Pubs — pacienți și sarcini" },
      { name: "description", content: "Med Pubs — evidența pacienților internați, investigațiilor, consulturilor și datelor de externare." },
      { property: "og:title", content: "Med Pubs — pacienți și sarcini" },
      { property: "og:description", content: "Med Pubs — pacienți, investigații, consulturi și planificarea externării pentru secțiile din România." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Filter = "all" | "consults" | "discharge";

function Index() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    Promise.resolve(useWard.persist.rehydrate()).then(() => setHydrated(true));
  }, []);
  const { lang, setLang, patients, replaceAll } = useWard();
  const t = tr(lang);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<"bed" | "discharge">("bed");
  const [dialog, setDialog] = useState<{ open: boolean; patient?: Patient | undefined }>({ open: false });
  const [journalOpen, setJournalOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const today = hydrated ? todayISO() : "1970-01-01";

  const active = useMemo(() => patients.filter((p) => !p.dischargedAt), [patients]);
  const list = useMemo(() => {
    const s = q.toLowerCase();
    return active
      .filter((p) => !s || [p.name, p.bed, p.diagnosis, p.fo].some((v) => v?.toLowerCase().includes(s)))
      .filter((p) => filter === "all" ? true
        : filter === "consults" ? p.tasks.some((x) => x.kind === "consult" && x.status !== "done")
        : ["today", "tomorrow", "overdue"].includes(dischargeState(p.discharge, today)))
      .sort((a, b) => sort === "bed"
        ? a.bed.localeCompare(b.bed, undefined, { numeric: true })
        : (a.discharge ?? "9999").localeCompare(b.discharge ?? "9999"));
  }, [active, q, filter, sort, today]);

  const openTasks = active.reduce((n, p) => n + p.tasks.filter((x) => x.status !== "done").length, 0);
  const pendingConsults = active.reduce((n, p) => n + p.tasks.filter((x) => x.kind === "consult" && x.status !== "done").length, 0);
  const dischargeSoon = active.filter((p) => ["today", "tomorrow", "overdue"].includes(dischargeState(p.discharge, today))).length;

  const exportData = () => {
    const { activity, favorites } = useWard.getState();
    const blob = new Blob([JSON.stringify({ version: 2, patients, activity, favorites }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `pacienti-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const importData = async (file: File) => {
    try {
      const data = parseBackup(JSON.parse(await file.text()));
      replaceAll(data.patients, data);
      toast.success("OK");
    } catch { toast.error("Invalid file"); }
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground"><Activity className="h-4 w-4" /></div>
            <div className="min-w-0"><h1 className="text-xl font-semibold">Med Pubs</h1><p className="text-xs text-muted-foreground">{t("title")}</p></div>
          </div>
          <div className="ml-auto flex max-w-full flex-wrap items-center gap-2">
            <ToggleGroup type="single" size="sm" value={lang} onValueChange={(v) => v && setLang(v as "ro" | "en")} variant="outline">
              <ToggleGroupItem value="ro">RO</ToggleGroupItem>
              <ToggleGroupItem value="en">EN</ToggleGroupItem>
            </ToggleGroup>
            <Button variant="ghost" size="icon" onClick={exportData} title={t("export")}><Download className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => setJournalOpen(true)} className="gap-1.5"><History className="h-4 w-4" />{t("journal")}</Button>
            <Button asChild variant="outline" size="sm"><Link to="/analize"><FileText className="h-4 w-4" />{lang === "ro" ? "Formatare analize" : "Format lab results"}</Link></Button>
            <Button variant="ghost" size="icon" onClick={() => fileRef.current?.click()} title={t("import")}><Upload className="h-4 w-4" /></Button>
            <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])} />
            <Button onClick={() => setDialog({ open: true })} className="gap-1"><Plus className="h-4 w-4" />{t("addPatient")}</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5">
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            [t("patients"), active.length],
            [t("openTasks"), openTasks],
            [t("pendingConsults"), pendingConsults],
            [t("dischargeSoon"), dischargeSoon],
          ].map(([l, v]) => (
            <div key={l as string} className="rounded-lg border bg-card px-4 py-3">
              <div className="text-xs text-muted-foreground">{l}</div>
              <div className="font-mono text-2xl font-medium">{hydrated ? v : "–"}</div>
            </div>
          ))}
        </section>

        <section className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-64 flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")} className="pl-8" />
          </div>
          <ToggleGroup className="max-w-full flex-wrap justify-start" type="single" size="sm" variant="outline" value={filter} onValueChange={(v) => v && setFilter(v as Filter)}>
            <ToggleGroupItem value="all">{t("all")}</ToggleGroupItem>
            <ToggleGroupItem value="consults">{t("pendingConsults")}</ToggleGroupItem>
            <ToggleGroupItem value="discharge">{t("dischargeSoon")}</ToggleGroupItem>
          </ToggleGroup>
          <ToggleGroup type="single" size="sm" variant="outline" value={sort} onValueChange={(v) => v && setSort(v as "bed" | "discharge")}>
            <ToggleGroupItem value="bed">{t("sortBed")}</ToggleGroupItem>
            <ToggleGroupItem value="discharge">{t("sortDischarge")}</ToggleGroupItem>
          </ToggleGroup>
        </section>

        {hydrated && list.length === 0 && (
          <div className="rounded-lg border border-dashed bg-card p-10 text-center text-muted-foreground">{t("empty")}</div>
        )}
        <div className="flex flex-col gap-3">
          {hydrated && list.map((p) => (
            <PatientCard key={p.id} patient={p} today={today} onEdit={() => setDialog({ open: true, patient: p })} />
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground">{t("localNote")}</p>
      </main>

      <PatientDialog open={dialog.open} patient={dialog.patient} onOpenChange={(o) => setDialog((d) => ({ ...d, open: o }))} />
      <ActivityJournal open={journalOpen} onOpenChange={setJournalOpen} />
    </div>
  );
}
