import { useState, type CSSProperties } from "react";
import { BedDouble, CalendarClock, FileText, LogOut, MoreVertical, Pencil, Plus, Trash2, X, Stethoscope, FlaskConical, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useWard } from "@/lib/store";
import { tr } from "@/lib/i18n";
import { DRGS, INVESTIGATIONS, INV_CATEGORIES, SPECIALTIES } from "@/lib/ward-data";
import { daysAdmitted, dischargeState, nextStatus, type Patient, type Task } from "@/lib/patients";
import { cn } from "@/lib/utils";

const tagStyle = (c: string) => ({ "--tag": c }) as CSSProperties;

export function taskColor(t: Task): string {
  if (t.kind === "consult") return SPECIALTIES.find((s) => s.key === t.key)?.color ?? "var(--cat-other)";
  if (t.kind === "investigation") {
    const inv = INVESTIGATIONS.find((i) => i.key === t.key);
    return inv ? INV_CATEGORIES[inv.cat].color : "var(--cat-other)";
  }
  return "var(--cat-other)";
}

export function PatientCard({ patient, today, onEdit }: { patient: Patient; today: string; onEdit: () => void }) {
  const { lang, updatePatient, removePatient, updateTask, removeTask, addTask, toggleDrg } = useWard();
  const t = tr(lang);
  const ds = dischargeState(patient.discharge, today);
  const [custom, setCustom] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [drgOpen, setDrgOpen] = useState(false);

  const open = patient.tasks.filter((x) => x.status !== "done");
  const done = patient.tasks.filter((x) => x.status === "done");

  const dsLabel = ds === "none" ? t("noDischarge") : ds === "overdue" ? t("overdue") : ds === "today" ? t("today") : ds === "tomorrow" ? t("tomorrow") : "";

  return (
    <article className="grid gap-0 overflow-hidden rounded-lg border bg-card shadow-sm md:grid-cols-[minmax(260px,320px)_1fr]">
      {/* Patient info */}
      <div className="flex flex-col gap-2 border-b bg-surface p-4 md:border-b-0 md:border-r">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <BedDouble className="h-3.5 w-3.5" /> {patient.bed || "—"}
              {patient.fo && <span className="font-mono">FO {patient.fo}</span>}
            </div>
            <h3 className="truncate text-base font-semibold">
              {patient.name}
              {patient.age ? <span className="ml-1.5 font-normal text-muted-foreground">{patient.age}a</span> : null}
            </h3>
            <p className="text-sm text-muted-foreground">{patient.diagnosis}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Actions">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}><Pencil className="h-4 w-4" />{t("editPatient")}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => updatePatient(patient.id, { dischargedAt: today })}>
                <LogOut className="h-4 w-4" />{t("dischargeNow")}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={() => confirm(t("confirmDelete")) && removePatient(patient.id)}>
                <Trash2 className="h-4 w-4" />{t("delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded bg-secondary px-2 py-0.5 font-medium text-secondary-foreground">
            {t("day")} {daysAdmitted(patient.admitted, today)}
          </span>
          <label
            className={cn(
              "flex items-center gap-1 rounded border px-2 py-0.5",
              ds === "overdue" && "border-destructive bg-destructive/10 text-destructive",
              ds === "today" && "border-warning bg-warning/15 font-semibold",
              ds === "tomorrow" && "border-warning/60",
            )}
          >
            <CalendarClock className="h-3.5 w-3.5" />
            {t("discharge")}:
            <input
              type="date"
              value={patient.discharge ?? ""}
              onChange={(e) => updatePatient(patient.id, { discharge: e.target.value || undefined })}
              className="bg-transparent outline-none"
            />
            {dsLabel && <span>· {dsLabel}</span>}
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {patient.drgs.map((code) => (
            <span key={code} className="group inline-flex items-center gap-1 rounded border bg-card px-1.5 py-0.5 font-mono text-xs" title={DRGS.find((d) => d.code === code)?.[lang]}>
              {code}
              <button onClick={() => toggleDrg(patient.id, code)} aria-label="remove" className="opacity-50 hover:opacity-100"><X className="h-3 w-3" /></button>
            </span>
          ))}
          <Popover open={drgOpen} onOpenChange={setDrgOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-6 gap-1 px-2 text-xs"><FileText className="h-3 w-3" />{t("drg")}</Button>
            </PopoverTrigger>
            <PopoverContent className="w-[420px] p-0" align="start">
              <Command>
                <CommandInput placeholder={t("drgSearch")} />
                <CommandList>
                  <CommandEmpty>—</CommandEmpty>
                  <CommandGroup>
                    {DRGS.map((d) => (
                      <CommandItem key={d.code} value={`${d.code} ${d.ro} ${d.en}`} onSelect={() => toggleDrg(patient.id, d.code)}>
                        <span className={cn("w-12 font-mono text-xs font-medium", patient.drgs.includes(d.code) && "text-primary")}>{d.code}</span>
                        <span className="flex-1 text-sm">{d[lang]}</span>
                        <span className="font-mono text-xs text-muted-foreground">{t("rw")} {d.rw.toFixed(2)}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
                <p className="border-t px-3 py-2 text-xs text-muted-foreground">{t("drgNote")}</p>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Tasks */}
      <div className="flex flex-col gap-2 p-4">
        <ul className="flex flex-col gap-1.5">
          {open.length === 0 && <li className="text-sm text-muted-foreground">{t("noTasks")}</li>}
          {[...open, ...done].map((task) => (
            <TaskRow key={task.id} task={task} lang={lang}
              onCycle={() => updateTask(patient.id, task.id, { status: nextStatus(task.status) })}
              onDate={(date) => updateTask(patient.id, task.id, { date: date || undefined, status: date && task.status === "pending" ? "scheduled" : task.status })}
              onRemove={() => removeTask(patient.id, task.id)} />
          ))}
        </ul>

        <div className="mt-auto flex flex-wrap gap-2 pt-2">
          <Popover open={addOpen} onOpenChange={setAddOpen}>
            <PopoverTrigger asChild>
              <Button size="sm" variant="secondary" className="gap-1"><Plus className="h-4 w-4" />{t("addTask")}</Button>
            </PopoverTrigger>
            <PopoverContent className="w-[360px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Doppler, CT, Cardio…" />
                <CommandList className="max-h-80">
                  <CommandEmpty>—</CommandEmpty>
                  <CommandGroup heading={t("investigations")}>
                    {INVESTIGATIONS.map((i) => (
                      <CommandItem key={i.key} value={`${i.ro} ${i.en}`} onSelect={() => { addTask(patient.id, { kind: "investigation", key: i.key, label: i[lang], status: "pending" }); setAddOpen(false); }}>
                        <FlaskConical className="h-4 w-4" style={{ color: INV_CATEGORIES[i.cat].color }} />
                        <span className="flex-1">{i[lang]}</span>
                        <span className="text-xs" style={{ color: INV_CATEGORIES[i.cat].color }}>{INV_CATEGORIES[i.cat][lang]}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandGroup heading={t("consults")}>
                    {SPECIALTIES.map((s) => (
                      <CommandItem key={s.key} value={`consult ${s.ro} ${s.en}`} onSelect={() => { addTask(patient.id, { kind: "consult", key: s.key, label: s[lang], status: "pending" }); setAddOpen(false); }}>
                        <s.icon className="h-4 w-4" style={{ color: s.color }} />
                        <span>{s[lang]}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <form className="flex flex-1 gap-2" onSubmit={(e) => { e.preventDefault(); if (!custom.trim()) return; addTask(patient.id, { kind: "custom", label: custom.trim(), status: "pending" }); setCustom(""); }}>
            <Input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder={t("customTask")} className="h-8 min-w-40" />
          </form>
        </div>
      </div>
    </article>
  );
}

function TaskRow({ task, lang, onCycle, onDate, onRemove }: { task: Task; lang: "ro" | "en"; onCycle: () => void; onDate: (d: string) => void; onRemove: () => void }) {
  const t = tr(lang);
  const color = taskColor(task);
  const spec = task.kind === "consult" ? SPECIALTIES.find((s) => s.key === task.key) : undefined;
  const Icon = spec?.icon ?? (task.kind === "investigation" ? FlaskConical : task.kind === "consult" ? Stethoscope : ListTodo);
  const label = task.kind === "consult" && spec ? `${lang === "ro" ? "Consult" : "Consult"} ${spec[lang]}`
    : task.kind === "investigation" ? (INVESTIGATIONS.find((i) => i.key === task.key)?.[lang] ?? task.label) : task.label;
  const isDone = task.status === "done";

  return (
    <li className={cn("tag flex items-center gap-2 rounded-md px-2 py-1.5 text-sm", isDone && "opacity-50")} style={tagStyle(color)}>
      <Icon className="h-4 w-4 shrink-0" />
      <span className={cn("flex-1 font-medium text-foreground", isDone && "line-through")}>{label}</span>
      <input type="date" value={task.date ?? ""} onChange={(e) => onDate(e.target.value)} className="w-[7.5rem] bg-transparent text-xs text-muted-foreground outline-none" aria-label={t("date")} />
      <button onClick={onCycle}
        className={cn("rounded px-2 py-0.5 text-xs font-semibold",
          task.status === "pending" && "bg-card text-foreground ring-1 ring-border",
          task.status === "scheduled" && "bg-warning/25 text-foreground",
          task.status === "done" && "bg-success text-primary-foreground")}>
        {t(task.status)}
      </button>
      <button onClick={onRemove} className="text-muted-foreground hover:text-destructive" aria-label={t("delete")}><X className="h-4 w-4" /></button>
    </li>
  );
}
