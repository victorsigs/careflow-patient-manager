export type TaskStatus = "pending" | "scheduled" | "done";
export type TaskKind = "investigation" | "consult" | "custom";

export interface Task {
  id: string;
  kind: TaskKind;
  key?: string; // preset key (investigation or specialty)
  label: string;
  status: TaskStatus;
  date?: string;
  note?: string;
}

export interface Patient {
  id: string;
  name: string;
  age?: number;
  bed: string;
  fo: string;
  diagnosis: string;
  admitted: string; // YYYY-MM-DD
  discharge?: string; // YYYY-MM-DD
  drgs: string[];
  tasks: Task[];
  dischargedAt?: string;
}

export function todayISO(now = new Date()): string {
  const d = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
}

/** Days in hospital; admission day counts as day 1. */
export function daysAdmitted(admitted: string, today: string): number {
  return Math.max(1, daysBetween(admitted, today) + 1);
}

export type DischargeState = "none" | "overdue" | "today" | "tomorrow" | "later";

export function dischargeState(discharge: string | undefined, today: string): DischargeState {
  if (!discharge) return "none";
  const d = daysBetween(today, discharge);
  if (d < 0) return "overdue";
  if (d === 0) return "today";
  if (d === 1) return "tomorrow";
  return "later";
}

export const STATUS_ORDER: TaskStatus[] = ["pending", "scheduled", "done"];
export function nextStatus(s: TaskStatus): TaskStatus {
  return STATUS_ORDER[(STATUS_ORDER.indexOf(s) + 1) % STATUS_ORDER.length];
}
