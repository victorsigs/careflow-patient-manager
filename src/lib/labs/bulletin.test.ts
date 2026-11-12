import { describe, expect, it } from 'vitest';
import { parseHtml, parsePdfItems } from './parse';
import { defaultExcludedReferences, formatLabs } from './format';

const row=(name:string,value:string,reference='',unit='')=>`<tr><td><b>${name}</b></td><td>${value}</td><td><b>${reference}</b> ${unit}</td></tr>`;
const subsection=(name:string)=>`<tr class="analiza"><td colspan="3"><b>${name}</b></td></tr>`;
const comment=(value:string)=>`<tr><td>Comentarii:</td><td colspan="2">${value}</td></tr>`;
const table=(rows:string)=>`<table class="Rap_table_class_generic"><thead><tr><th>HEMATOLOGIE</th><th>Denumire analiza</th><th>Rezultat</th></tr></thead><tbody>${rows}</tbody></table>`;
const bulletin=(rows:string)=>parseHtml(`<p>NUME: Test Exemplu<br>Data recoltarii: 09.11.2026 06:34</p>${table(rows)}`,'test.html','test');

describe('hospital bulletin regression rules',()=>{
  it.each([
    ['AFP (alfafetoproteina)**','Alfafetoproteina','1.00','0 - 5.8','UI/mL'],
    ['CA 19-9 (cancer antigen 19-9)**','CA 19-9','8.64','0 - 27','UI/mL'],
    ['CEA (antigen carcinoembrionar)**','CEA','2.48','0 - 3.8','ng/mL'],
    ['Homocisteina*','Homocisteina','12.3','4.390 - 14.650','µmol/L'],
  ])('includes %s when outside-template analyses are off',(raw,name,value,ref,unit)=>{
    expect(formatLabs([bulletin(row(raw,value,ref,unit))],false)).toContain(`${name} ${value} ${unit} (VN: ${ref} ${unit})`);
  });
  it('retains all five manual differential values and morphology in the dated smear block',()=>{
    const parsed=bulletin(subsection('Frotiu sanguin')+row('Segmentat','59',' - ','%')+row('Eozinofil','1',' - ','%')+row('Bazofil','0','','%')+row('Monocit','8','','%')+row('Limfocit','32',' - ','%')+comment('Normocromie, normocitoza. Trombocite prezente.'));
    expect(parsed.results.every(r=>r.section==='smear')).toBe(true);
    expect(formatLabs([parsed],false,true,new Set(defaultExcludedReferences(parsed)))).toBe('Frotiu Sangvin (09.11.2026): Segmentate 59%, Eozinofile 1%, Bazofile 0%, Monocite 8%, Limfocite 32%, Normocromie, normocitoza. Trombocite prezente.');
  });
  it.each([['Ac Anti HCV','0.04'],['Antigen HBs','0.27'],['Ac Anti HIV','0.10']])('uses the explicit negative conclusion for %s while retaining source numbers',(name,value)=>{
    const parsed=bulletin(subsection(name)+row(name,value,'0 - 0.9','Index CO')+comment('Negativ'));
    expect(formatLabs([parsed],false)).toBe(`Probe serice: ${name} negativ.`);
    expect(parsed.results[0]?.value).toBe(value);
    expect(parsed.results[0]?.reference).toBe('0 - 0.9');
    expect(parsed.results[1]?.value).toBe('Negativ');
  });
  it('never guesses positive or negative from a numeric reference range',()=>{
    expect(formatLabs([bulletin(row('Ac Anti HCV','0.04','0 - 0.9','Index CO'))],false)).toContain('Ac Anti HCV 0.04 Index CO (VN: 0 - 0.9 Index CO)');
  });
  it('associates positive and equivocal comments only with their own test, not a subsequent heading',()=>{
    const parsed=bulletin(subsection('Ac Anti HCV')+row('Ac Anti HCV','2','0 - 0.9','Index CO')+comment('Pozitiv')+subsection('Antigen HBs')+comment('Negativ')+row('Antigen HBs','0.95','0 - 0.9','Index CO')+comment('Echivoc'));
    expect(formatLabs([parsed],false)).toContain('Ac Anti HCV pozitiv, Antigen HBs echivoc.');
    expect(parsed.results[2]?.interpretationFor).toBeUndefined();
  });
  it('recognizes smear subsection headings and explicit serology comments in selectable PDFs',()=>{
    const items=[
      ['NUME: Test Exemplu',10,800],['Data recoltarii: 09.11.2026 06:34',10,780],
      ['Rezultat',200,700],['Interval biologic de referinta/UM',300,700],
      ['Ac Anti HCV',10,680],['0.04',200,680],['0 - 0.9 Index CO',300,680],
      ['Comentarii:',10,660],['Negativ',200,660],['Frotiu sanguin',10,640],
      ['Segmentat',10,620],['59',200,620],['- %',300,620],
      ['Comentarii:',10,600],['Normocromie, normocitoza. Trombocite prezente.',200,600],
    ].map(([text,x,y])=>({text:String(text),x:Number(x),y:Number(y),page:1,width:50}));
    const output=formatLabs([parsePdfItems(items,'test.pdf','pdf')],false);
    expect(output).toContain('Ac Anti HCV negativ.');
    expect(output).toContain('Frotiu Sangvin (09.11.2026): Segmentate 59%, Normocromie, normocitoza. Trombocite prezente.');
  });
});