import type { Patient, Task } from "./patients";

export type ActivityAction = "patientAdded" | "patientUpdated" | "patientRemoved" | "patientDischarged" | "taskAdded" | "taskUpdated" | "taskRemoved" | "backupImported";
export interface ActivityChange { field: string; before: string; after: string }
export interface ActivityEntry {
  id: string;
  at: string;
  action: ActivityAction;
  patientId?: string | undefined;
  patientName?: string | undefined;
  subject?: string | undefined;
  changes: ActivityChange[];
}
export const uid = () => crypto.randomUUID();
export const entry = (action: ActivityAction, patient?: Patient, subject?: string, changes: ActivityChange[] = []): ActivityEntry => ({
  id: uid(), at: new Date().toISOString(), action, patientId: patient?.id, patientName: patient?.name, subject, changes,
});
export function changesBetween(before: Patient | Task, patch: Partial<Patient> | Partial<Task>): ActivityChange[] {
  const a = before as unknown as Record<string, unknown>;
  return Object.entries(patch).filter(([field, value]) => !["id", "tasks", "drgs"].includes(field) && a[field] !== value)
    .map(([field, value]) => ({ field, before: String(a[field] ?? ""), after: String(value ?? "") }));
}