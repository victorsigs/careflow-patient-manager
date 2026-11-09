import { TEMPLATE } from './catalog';
import type { LabReport } from './format';

export type TemplateElement = { id: string; label: string };
export const elementKey = (section: string, name: string) => JSON.stringify([section, name]);
export const sectionKey = (section: string) => `section:${section}`;
export function templateElements(reports: LabReport[]): TemplateElement[] {
  const elements: TemplateElement[] = [
    { id: sectionKey('blood'), label: 'Probe serice' },
    ...TEMPLATE.map(([name]) => ({ id: elementKey('blood', name), label: name })),
    { id: sectionKey('urine'), label: 'Examen Sumar de Urina' },
    { id: sectionKey('smear'), label: 'Frotiu Sangvin' },
    { id: sectionKey('notes'), label: 'Observații probe' },
  ];
  const seen = new Set(elements.map(e => e.id));
  for (const report of reports) for (const result of report.results) {
    const section = result.note ? 'notes' : result.section;
    const id = elementKey(section, result.name);
    if (!seen.has(id)) {
      seen.add(id);
      elements.push({ id, label: `${result.name}${section === 'blood' ? '' : ` · ${section === 'urine' ? 'Urină' : section === 'smear' ? 'Frotiu' : 'Observații'}`}` });
    }
  }
  return elements;
}
export function orderedReports(reports: LabReport[], order: readonly string[] = []): LabReport[] {
  const positions = new Map(order.map((id, i) => [id, i]));
  return [...reports].sort((a, b) => {
    const aIndex = positions.get(a.id), bIndex = positions.get(b.id);
    if (aIndex !== undefined || bIndex !== undefined) return (aIndex ?? order.length) - (bIndex ?? order.length);
    return a.collectedAt.localeCompare(b.collectedAt);
  });
}
export function moveItem<T>(items: readonly T[], from: T, to: T): T[] {
  const next = [...items], start = next.indexOf(from), end = next.indexOf(to);
  if (start < 0 || end < 0) return next;
  next.splice(start, 1); next.splice(end, 0, from);
  return next;
}
export function transferReport(reports: LabReport[], reportId: string, target: { key: string; name: string }): LabReport[] {
  return reports.map(report => report.id !== reportId || report.patientKey === target.key ? report : {
    ...report,
    originalPatient: report.originalPatient ?? { key: report.patientKey, name: report.patientName },
    patientKey: target.key, patientName: target.name,
  });
}