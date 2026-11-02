import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Patient, Task } from "./patients";
import type { Lang } from "./ward-data";
import { changesBetween, entry, uid, type ActivityEntry } from "./activity";

interface WardState {
  lang: Lang;
  patients: Patient[];
  activity: ActivityEntry[];
  favorites: string[];
  toggleFavorite: (key: string) => void;
  setLang: (l: Lang) => void;
  addPatient: (p: Omit<Patient, "id" | "tasks" | "drgs">) => void;
  updatePatient: (id: string, p: Partial<Patient>) => void;
  removePatient: (id: string) => void;
  addTask: (pid: string, t: Omit<Task, "id">) => void;
  updateTask: (pid: string, tid: string, t: Partial<Task>) => void;
  removeTask: (pid: string, tid: string) => void;
  toggleDrg: (pid: string, code: string) => void;
  replaceAll: (patients: Patient[], extras?: { activity?: ActivityEntry[]; favorites?: string[] }) => void;
}

const mapP = (ps: Patient[], id: string, f: (p: Patient) => Patient) => ps.map((p) => (p.id === id ? f(p) : p));

export const useWard = create<WardState>()(
  persist(
    (set) => ({
      lang: "ro",
      patients: [],
      activity: [],
      favorites: [],
      toggleFavorite: (key) => set((s) => ({ favorites: s.favorites.includes(key) ? s.favorites.filter(k => k !== key) : [...s.favorites, key] })),
      setLang: (lang) => set({ lang }),
      addPatient: (p) => set((s) => {
        const patient = { ...p, id: uid(), tasks: [], drgs: [] };
        return { patients: [...s.patients, patient], activity: [...s.activity, entry("patientAdded", patient)] };
      }),
      updatePatient: (id, u) => set((s) => {
        const p = s.patients.find(p => p.id === id);
        if (!p) return s;
        const changes = changesBetween(p, u);
        if (!changes.length) return s;
        return { patients: mapP(s.patients, id, (p) => ({ ...p, ...u })), activity: [...s.activity, entry(u.dischargedAt ? "patientDischarged" : "patientUpdated", p, undefined, changes)] };
      }),
      removePatient: (id) => set((s) => {
        const p = s.patients.find(p => p.id === id);
        return p ? { patients: s.patients.filter(p => p.id !== id), activity: [...s.activity, entry("patientRemoved", p)] } : s;
      }),
      addTask: (pid, t) =>
        set((s) => {
          const p = s.patients.find(p => p.id === pid);
          return p ? { patients: mapP(s.patients, pid, (p) => ({ ...p, tasks: [...p.tasks, { ...t, id: uid() }] })), activity: [...s.activity, entry("taskAdded", p, t.label, t.contrast === undefined ? [] : [{ field: "contrast", before: "", after: String(t.contrast) }])] } : s;
        }),
      updateTask: (pid, tid, u) =>
        set((s) => {
          const p = s.patients.find(p => p.id === pid);
          const task = p?.tasks.find(t => t.id === tid);
          if (!p || !task) return s;
          const changes = changesBetween(task, u);
          if (!changes.length) return s;
          return { patients: mapP(s.patients, pid, (p) => ({ ...p, tasks: p.tasks.map((t) => (t.id === tid ? { ...t, ...u } : t)) })), activity: [...s.activity, entry("taskUpdated", p, task.label, changes)] };
        }),
      removeTask: (pid, tid) =>
        set((s) => {
          const p = s.patients.find(p => p.id === pid);
          const task = p?.tasks.find(t => t.id === tid);
          return p && task ? { patients: mapP(s.patients, pid, (p) => ({ ...p, tasks: p.tasks.filter((t) => t.id !== tid) })), activity: [...s.activity, entry("taskRemoved", p, task.label)] } : s;
        }),
      toggleDrg: (pid, code) =>
        set((s) => ({
          patients: mapP(s.patients, pid, (p) => ({
            ...p,
            drgs: p.drgs.includes(code) ? p.drgs.filter((c) => c !== code) : [...p.drgs, code],
          })),
        })),
      replaceAll: (patients, extras) => set((s) => ({ patients, favorites: extras?.favorites ?? s.favorites, activity: [...new Map([...s.activity, ...(extras?.activity ?? [])].map(e => [e.id, e])).values(), entry("backupImported", undefined, String(patients.length))] })),
    }),
    { name: "ward-board-v1", storage: createJSONStorage(() => localStorage), skipHydration: true },
  ),
);
