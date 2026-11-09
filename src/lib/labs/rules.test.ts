import { describe, it, expect } from 'vitest';
import { isPathological, defaultExcludedReferences, formatLabsDocument, type LabReport } from './format';
const report: LabReport = { id: 'r1', filename: 'a', patientKey: 'p', patientName: 'P', collectedAt: '2026-01-01T08:00:00', warnings: [], results: [
  { name: 'Hemoglobină', rawName: 'HGB', value: '10', unit: 'g/dL', reference: '12 - 16', section: 'blood', date: '', source: '' },
  { name: 'Feritina', rawName: 'Feritina', value: '50', unit: 'ng/mL', reference: '20 - 200', section: 'blood', date: '', source: '' },
] };
describe('lab formatting rules', () => {
  it('flags values outside range', () => { expect(isPathological('10', '12 - 16')).toBe(true); expect(isPathological('13', '12 - 16')).toBe(false); expect(isPathological('6', '< 5')).toBe(true); });
  it('hides listed references by default', () => { expect(defaultExcludedReferences(report)).toEqual([JSON.stringify(['r1', 0])]); });
  it('starts with bold Probe serice and bold names, underlines abnormal', () => {
    const [p] = formatLabsDocument([report], true, true, new Set(), {}, true);
    expect(p?.[0]).toEqual({ text: 'Probe serice:', bold: true });
    expect(p?.find(s => s.text === 'Hemoglobină')?.bold).toBe(true);
    expect(p?.find(s => s.text === '10')?.underline).toBe(true);
    expect(p?.find(s => s.text === '50')?.underline).toBeUndefined();
  });
});
