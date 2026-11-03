import { useState, type CSSProperties } from "react";
import { BedDouble, CalendarClock, LogOut, MoreVertical, Pencil, Plus, Trash2, X, Stethoscope, FlaskConical, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useWard } from "@/lib/store";
import { tr } from "@/lib/i18n";
import { INVESTIGATIONS, INV_CATEGORIES, SPECIALTIES } from "@/lib/ward-data";
import { daysAdmitted, dischargeState, nextStatus, type Patient, type Task } from "@/lib/patients";
import { cn } from "@/lib/utils";
import { InvestigationPicker } from "./InvestigationPicker";

const tagStyle = (c: string) => ({ "--tag": c }) as CSSProperties;

export function taskColor(t: Task): string {
  if (t.kind === "consult") return SPECIALTIES.find((s) => s.key === t.key)?.color ?? "var(--cat-other)";
  if (t.kind === "investigation") {
    const inv = INVESTIGATIONS.find((i) => i.key === t.key);
    return inv ? INV_CATEGORIES[inv.cat].color : ["ct", "angioct", "mri", "rx", "eco", "ecocord"].includes(t.key ?? "") ? INV_CATEGORIES.imaging.color : "var(--cat-other)";
  }
  return "var(--cat-other)";
}

export function PatientCard({ patient, today, onEdit }: { patient: Patient; today: string; onEdit: () => void }) {
  const { lang, updatePatient, removePatient, updateTask, removeTask, addTask } = useWard();
  const t = tr(lang);
  const ds = dischargeState(patient.discharge, today);
  const [custom, setCustom] = useState("");
  const [addOpen, setAddOpen] = useState<"investigation" | "consult" | null>(null);

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
        </div>

          <label
            htmlFor={`discharge-${patient.id}`}
            className={cn(
              "mt-1 flex flex-col gap-2 rounded-md border border-primary/30 bg-card p-3 text-sm transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/20",
              ds === "overdue" && "border-destructive bg-destructive/10 text-destructive",
              ds === "today" && "border-warning bg-warning/15 font-semibold",
              ds === "tomorrow" && "border-warning/60",
            )}
          >
            <span className="flex items-center gap-2 font-medium">
              <CalendarClock className="h-4 w-4 text-primary" />
              {t("dischargeDate")}
              <Pencil className="ml-auto h-3.5 w-3.5 text-primary" />
            </span>
            <Input
              id={`discharge-${patient.id}`}
              type="date"
              value={patient.discharge ?? ""}
              onChange={(e) => updatePatient(patient.id, { discharge: e.target.value || undefined })}
              className="h-9 w-full min-w-0 cursor-pointer bg-background text-foreground"
            />
            {dsLabel && <span className="text-xs font-medium">{dsLabel}</span>}
          </label>
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
          <InvestigationPicker patientId={patient.id} mode="lab" />
          <InvestigationPicker patientId={patient.id} mode="imaging" />
          {(["consult"] as const).map((kind) => (
          <Popover key={kind} open={addOpen === kind} onOpenChange={(open) => setAddOpen(open ? kind : null)}>
            <PopoverTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5">
                 <Stethoscope className="h-4 w-4 text-primary" />
                 {t("addConsult")}
                <Plus className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[360px] max-w-[calc(100vw-2rem)] p-0" align="start">
              <Command>
                 <CommandInput placeholder={t("searchConsult")} />
                <CommandList className="max-h-80">
                  <CommandEmpty>—</CommandEmpty>
                  {kind === "consult" && <CommandGroup heading={t("consults")}>
                    {SPECIALTIES.map((s) => (
                      <CommandItem key={s.key} value={`consult ${s.ro} ${s.en}`} onSelect={() => { addTask(patient.id, { kind: "consult", key: s.key, label: s[lang], status: "pending" }); setAddOpen(null); }}>
                        <s.icon className="h-4 w-4" style={{ color: s.color }} />
                        <span>{s[lang]}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          ))}
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
    <li className={cn("tag flex flex-wrap items-center gap-2 rounded-md px-2 py-1.5 text-sm", isDone && "opacity-50")} style={tagStyle(color)}>
      <Icon className="h-4 w-4 shrink-0" />
      <span className={cn("min-w-0 flex-1 basis-40 break-words font-medium text-foreground", isDone && "line-through")}>{label}{task.contrast !== undefined && <span className="block text-xs font-normal">{t(task.contrast ? "withContrast" : "withoutContrast")}</span>}</span>
      <input type="date" value={task.date ?? ""} onChange={(e) => onDate(e.target.value)} className="w-[7.5rem] bg-transparent text-xs text-muted-foreground outline-none" aria-label={t("date")} />
      <Button variant="ghost" size="sm" onClick={onCycle}
        className={cn("h-6 rounded px-2 py-0.5 text-xs font-semibold",
          task.status === "pending" && "bg-card text-foreground ring-1 ring-border",
          task.status === "scheduled" && "bg-warning/25 text-foreground",
          task.status === "done" && "bg-success text-primary-foreground")}>
        {t(task.status)}
      </Button>
      <Button variant="ghost" size="icon" onClick={onRemove} className="h-6 w-6 text-muted-foreground hover:text-destructive" aria-label={t("delete")}><X className="h-4 w-4" /></Button>
    </li>
  );
}
