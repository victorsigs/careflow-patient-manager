import type { Patient } from "./patients";
import type { ActivityEntry } from "./activity";
const record = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);
function validPatient(x: unknown): x is Patient {
  return record(x) && ["id", "name", "bed", "fo", "diagnosis", "admitted"].every(k => typeof x[k] === "string") &&
    (x["drgs"] === undefined || Array.isArray(x["drgs"]) && x["drgs"].every(d => typeof d === "string")) &&
    Array.isArray(x["tasks"]) && x["tasks"].every(t => record(t) && typeof t["id"] === "string" && typeof t["label"] === "string" && ["consult", "investigation", "custom"].includes(String(t["kind"])) && ["pending", "scheduled", "done"].includes(String(t["status"])) && (t["contrast"] === undefined || typeof t["contrast"] === "boolean")) &&
    ["discharge", "dischargedAt"].every(k => x[k] === undefined || typeof x[k] === "string");
}
export function parseBackup(data: unknown): { patients: Patient[]; activity?: ActivityEntry[]; favorites?: string[] } {
  const raw = Array.isArray(data) ? data : record(data) ? data["patients"] : undefined;
  if (!Array.isArray(raw) || !raw.every(validPatient)) throw new Error("Invalid patients");
  const patients = raw.map(p => ({ ...p, drgs: p.drgs ?? [] }));
  if (Array.isArray(data)) return { patients };
  if (!record(data) || !Array.isArray(data["favorites"]) || !data["favorites"].every(k => typeof k === "string") || !Array.isArray(data["activity"])) throw new Error("Invalid backup");
  const actions = ["patientAdded", "patientUpdated", "patientRemoved", "patientDischarged", "taskAdded", "taskUpdated", "taskRemoved", "backupImported"];
  if (!data["activity"].every(e => record(e) && typeof e["id"] === "string" && typeof e["at"] === "string" && Number.isFinite(Date.parse(e["at"])) && actions.includes(String(e["action"])) && ["patientId", "patientName", "subject"].every(k => e[k] === undefined || typeof e[k] === "string") && Array.isArray(e["changes"]) && e["changes"].every(c => record(c) && ["field", "before", "after"].every(k => typeof c[k] === "string")))) throw new Error("Invalid activity");
  return { patients, favorites: data["favorites"] as string[], activity: data["activity"] as ActivityEntry[] };
}