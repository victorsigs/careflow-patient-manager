import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWard } from "@/lib/store";
import { tr } from "@/lib/i18n";
import { todayISO, type Patient } from "@/lib/patients";

export function PatientDialog({ open, onOpenChange, patient }: { open: boolean; onOpenChange: (o: boolean) => void; patient?: Patient | undefined }) {
  const { lang, addPatient, updatePatient } = useWard();
  const t = tr(lang);
  const empty = { name: "", age: "", bed: "", fo: "", diagnosis: "", admitted: todayISO(), discharge: "" };
  const [f, setF] = useState(empty);

  useEffect(() => {
    if (!open) return;
    setF(patient ? { name: patient.name, age: patient.age?.toString() ?? "", bed: patient.bed, fo: patient.fo, diagnosis: patient.diagnosis, admitted: patient.admitted, discharge: patient.discharge ?? "" } : { ...empty, admitted: todayISO() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, patient]);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name.trim()) return;
    const data = { name: f.name.trim(), age: f.age ? Number(f.age) : undefined, bed: f.bed.trim(), fo: f.fo.trim(), diagnosis: f.diagnosis.trim(), admitted: f.admitted, discharge: f.discharge || undefined };
    if (patient) updatePatient(patient.id, data); else addPatient(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{patient ? t("editPatient") : t("addPatient")}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="grid grid-cols-2 gap-3">
          <div className="col-span-2 grid gap-1.5"><Label>{t("name")}</Label><Input autoFocus required value={f.name} onChange={set("name")} /></div>
          <div className="grid gap-1.5"><Label>{t("age")}</Label><Input type="number" min={0} value={f.age} onChange={set("age")} /></div>
          <div className="grid gap-1.5"><Label>{t("bed")}</Label><Input value={f.bed} onChange={set("bed")} placeholder="S3 / P2" /></div>
          <div className="grid gap-1.5"><Label>{t("fo")}</Label><Input value={f.fo} onChange={set("fo")} /></div>
          <div className="grid gap-1.5"><Label>{t("admitted")}</Label><Input type="date" value={f.admitted} onChange={set("admitted")} /></div>
          <div className="col-span-2 grid gap-1.5"><Label>{t("diagnosis")}</Label><Input value={f.diagnosis} onChange={set("diagnosis")} /></div>
          <div className="grid gap-1.5"><Label>{t("discharge")}</Label><Input type="date" value={f.discharge} onChange={set("discharge")} /></div>
          <DialogFooter className="col-span-2 mt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
            <Button type="submit">{t("save")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
