import { describe, expect, it } from 'vitest';
import { formatLabs, parseDate, referenceKey, resultFromCells, type LabReport } from './format';
import { metadata, parseHtml, parsePdfItems, splitReference } from './parse';

const report = (date: string, value: string, patientKey = 'patient:example'): LabReport => ({
  id: date, filename: 'example.html', patientKey, patientName: 'Example', collectedAt: date,
  results: [resultFromCells('Creatinina', value, 'mg/dL', '', 'blood', date, 'example.html')], warnings: [],
});
const html = `<p>NUME: Exemplu Test<br>CNP: 1234567890123<br>Data si ora recoltarii: 08 nov 2026 08:30</p>
<table class="Rap_table_class_generic"><thead><tr><th>Denumire analiza</th><th>Rezultat</th><th>Interval biologic de referinta/UM</th></tr></thead><tbody>
<tr><td>Numar de leucocite</td><td>8.1</td><td><b>4 - 10</b> 10<sup>3</sup>/µL</td></tr>
<tr><td>Creatinina</td><td>1.20</td><td><b>0.5 - 1.2</b> mg/dL</td></tr>
</tbody></table>`;

describe('laboratory formatting rules', () => {
  it('includes supplied normal ranges for every analysis, including urine and smear', () => {
    const a = report('2026-11-07T08:00:00', '1');
    a.results = [
      resultFromCells('Creatinina','1','mg/dL','0.5 - 1.2','blood','',''),
      resultFromCells('Test suplimentar','5','U/L','2 - 7','blood','',''),
      resultFromCells('Proteine','negativ','','negativ','urine','',''),
      resultFromCells('Test frotiu','1','%','0 - 2','smear','',''),
    ];
    const output = formatLabs([a]);
    expect(output).toContain('Creatinina 1 mg/dL (VN: 0.5 - 1.2 mg/dL)');
    expect(output).toContain('Test suplimentar 5 U/L (VN: 2 - 7 U/L)');
    expect(output).toContain('Proteine negativ (VN: negativ)');
    expect(output).toContain('Test frotiu 1 % (VN: 0 - 2 %)');
    expect(formatLabs([a],true,false)).not.toContain('VN:');
  });
  it('excludes selected ranges without removing results or other ranges', () => {
    const a = report('2026-11-07T08:00:00', '1');
    a.results[0] = resultFromCells('Creatinina','1','mg/dL','0.5 - 1.2','blood','','');
    a.results.push(resultFromCells('Uree','30','mg/dL','15 - 40','blood','',''));
    const b = report('2026-11-08T08:00:00', '2');
    b.results[0] = resultFromCells('Creatinina','2','mg/dL','0.5 - 1.2','blood','','');
    const output = formatLabs([a,b],true,true,new Set([referenceKey(a.id,0)]));
    expect(output).toContain('Creatinina 1 mg/dL,');
    expect(output).toContain('Creatinina 2 mg/dL (VN: 0.5 - 1.2 mg/dL)');
    expect(output).toContain('Uree 30 mg/dL (VN: 15 - 40 mg/dL)');
  });
  it('orders values by collection time rather than upload order', () => {
    expect(formatLabs([report('2026-11-08T10:00:00', '3.0'), report('2026-11-07T09:00:00', '1.0'), report('2026-11-08T08:00:00', '2.0')])).toContain('Creatinina 1.0-2.0-3.0 mg/dL');
  });
  it('rejects combining different patients', () => {
    expect(() => formatLabs([report('2026-11-08T08:00:00', '1'), report('2026-11-08T08:00:00', '2', 'patient:other')])).toThrow();
  });
  it('blocks formatting until missing collection dates are supplied', () => {
    expect(() => formatLabs([report('', '1')])).toThrow();
  });
  it('preserves separate units and reference ranges', () => {
    const a = report('2026-11-07T08:00:00', '1');
    const b = report('2026-11-08T08:00:00', '88');
    const c = report('2026-11-09T08:00:00', '2');
    if (b.results[0]) b.results[0].unit = 'µmol/L';
    if (c.results[0]) c.results[0].reference = '0.7 - 1.3';
    const output = formatLabs([a,b,c]);
    expect(output).toContain('Creatinina 1 mg/dL');
    expect(output).toContain('Creatinina 88 µmol/L');
    expect(output).toContain('Creatinina 2 mg/dL');
    expect(output).not.toContain('1-88-2');
  });
  it('converts only explicit count multipliers', () => {
    expect(resultFromCells('Leucocite','8.1','10^3/µL','','blood','','').value).toBe('8100');
    expect(resultFromCells('Trombocite','120','10^3/µL','','blood','','').value).toBe('120000');
    expect(resultFromCells('Leucocite','8.1','/µL','','blood','','').value).toBe('8.1');
  });
  it('retains the original reference unit when count values are converted', () => {
    const a = report('2026-11-07T08:00:00','1');
    a.results = [resultFromCells('Leucocite','8.1','10^3/µL','4 - 10','blood','','')];
    expect(formatLabs([a])).toContain('Leucocite 8100 /µL (VN: 4 - 10 10^3/µL)');
  });
  it('removes duplicated measurements but retains later equal values', () => {
    const a = report('2026-11-07T08:00:00','1');
    expect(formatLabs([a,a,report('2026-11-08T08:00:00','1')])).toContain('Creatinina 1-1 mg/dL');
  });
  it('uses template order and retains optional non-template analyses', () => {
    const a = report('2026-11-07T08:00:00','1');
    a.results.push(resultFromCells('Leucocite','8100','/µL','','blood','',''), resultFromCells('Test suplimentar','5','U/L','','blood','',''));
    expect(formatLabs([a]).indexOf('Leucocite')).toBeLessThan(formatLabs([a]).indexOf('Creatinina'));
    expect(formatLabs([a])).toContain('Test suplimentar 5 U/L');
    expect(formatLabs([a],false)).not.toContain('Test suplimentar');
  });
  it('parses dates and rejects invalid calendar dates', () => {
    expect(parseDate('08 nov 2026 08:30')).toBe('2026-11-08T08:30:00');
    expect(parseDate('31.02.2026')).toBe('');
  });
  it('extracts HTML table results and superscript units without executing scripts', () => {
    const parsed = parseHtml(html + '<script>throw new Error("executed")</script>', 'example.html', 'example');
    expect(parsed.results).toHaveLength(2);
    expect(parsed.results[0]?.value).toBe('8100');
    expect(parsed.collectedAt).toBe('2026-11-08T08:30:00');
    expect(parsed.patientKey).toBe('patient:1234567890123');
  });
  it('keeps unidentified bulletins isolated', () => {
    const anonymous = html.replace(/<p>[\s\S]*?<\/p>/, '');
    expect(parseHtml(anonymous,'a.html','a').patientKey).toBe('unknown:a');
    expect(parseHtml(anonymous,'b.html','b').patientKey).toBe('unknown:b');
  });
  it('extracts selectable PDF text by physical columns', () => {
    const items = [
      {text:'NUME: Exemplu Test',x:10,y:800},
      {text:'Data recoltarii: 08.11.2026 08:30',x:10,y:780},
      {text:'Denumire analiza',x:10,y:700}, {text:'Rezultat',x:200,y:700}, {text:'Interval biologic de referinta/UM',x:300,y:700},
      {text:'Creatinina',x:10,y:680}, {text:'1.20',x:200,y:680}, {text:'0.5 - 1.2 mg/dL',x:300,y:680},
    ].map(item=>({...item,page:1,width:50}));
    const parsed = parsePdfItems(items.reverse(),'example.pdf','pdf');
    expect(parsed.results).toHaveLength(1);
    expect(parsed.results[0]?.value).toBe('1.20');
    expect(parsed.results[0]?.unit).toBe('mg/dL');
    expect(parsed.collectedAt).toBe('2026-11-08T08:30:00');
  });
  it('rejects image-only PDFs', () => {
    expect(()=>parsePdfItems([],'scan.pdf','scan')).toThrow();
  });
  it('recognizes reference ranges independently of units', () => {
    expect(splitReference('0.5 - 1.2 mg/dL')).toEqual({reference:'0.5 - 1.2',unit:'mg/dL'});
  });
  it('identifies patient and collection metadata', () => {
    expect(metadata('NUME: Exemplu Test\nCNP: 1234567890123\nData recoltarii: 08.11.2026 08:30').patientName).toBe('Exemplu Test');
  });
  it('does not include intervening metadata fields in the patient name', () => {
    expect(metadata('NUME: Exemplu Test MCP: 123 CNP: 1234567890123').patientName).toBe('Exemplu Test');
  });
});