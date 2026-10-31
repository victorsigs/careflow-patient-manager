import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Patient, Task } from "./patients";
import type { Lang } from "./ward-data";

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

interface WardState {
  lang: Lang;
  patients: Patient[];
  setLang: (l: Lang) => void;
  addPatient: (p: Omit<Patient, "id" | "tasks" | "drgs">) => void;
  updatePatient: (id: string, p: Partial<Patient>) => void;
  removePatient: (id: string) => void;
  addTask: (pid: string, t: Omit<Task, "id">) => void;
  updateTask: (pid: string, tid: string, t: Partial<Task>) => void;
  removeTask: (pid: string, tid: string) => void;
  toggleDrg: (pid: string, code: string) => void;
  replaceAll: (patients: Patient[]) => void;
}

const mapP = (ps: Patient[], id: string, f: (p: Patient) => Patient) => ps.map((p) => (p.id === id ? f(p) : p));

export const useWard = create<WardState>()(
  persist(
    (set) => ({
      lang: "ro",
      patients: [],
      setLang: (lang) => set({ lang }),
      addPatient: (p) => set((s) => ({ patients: [...s.patients, { ...p, id: uid(), tasks: [], drgs: [] }] })),
      updatePatient: (id, u) => set((s) => ({ patients: mapP(s.patients, id, (p) => ({ ...p, ...u })) })),
      removePatient: (id) => set((s) => ({ patients: s.patients.filter((p) => p.id !== id) })),
      addTask: (pid, t) =>
        set((s) => ({ patients: mapP(s.patients, pid, (p) => ({ ...p, tasks: [...p.tasks, { ...t, id: uid() }] })) })),
      updateTask: (pid, tid, u) =>
        set((s) => ({
          patients: mapP(s.patients, pid, (p) => ({ ...p, tasks: p.tasks.map((t) => (t.id === tid ? { ...t, ...u } : t)) })),
        })),
      removeTask: (pid, tid) =>
        set((s) => ({ patients: mapP(s.patients, pid, (p) => ({ ...p, tasks: p.tasks.filter((t) => t.id !== tid) })) })),
      toggleDrg: (pid, code) =>
        set((s) => ({
          patients: mapP(s.patients, pid, (p) => ({
            ...p,
            drgs: p.drgs.includes(code) ? p.drgs.filter((c) => c !== code) : [...p.drgs, code],
          })),
        })),
      replaceAll: (patients) => set({ patients }),
    }),
    { name: "ward-board-v1", storage: createJSONStorage(() => localStorage), skipHydration: true },
  ),
);
