export const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[＊*]/g, '').replace(/\s+/g, ' ').trim();
export const clean = (s: string) => s.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
export const TEMPLATE = [
  ['Leucocite', 'numar de leucocite|leucocite|wbc'],
  ['Hemoglobină', 'hemoglobina|hgb|hb'], ['Hematocrit', 'hematocrit|hct'],
  ['Trombocite', 'numar de plachete|trombocite|plachete|plt'],
  ['VSH', 'viteza de sedimentare a hematiilor|vsh'], ['PCR', 'proteina c reactiva cantitativ|proteina c reactiva|pcr|crp'],
  ['INR', 'raportul normalizat international (inr)|inr'], ['Procalcitonina', 'procalcitonina|pct'],
  ['GOT', 'ast (aspartataminotransferaza) -tgo|ast|tgo|got'], ['GPT', 'alt (alaninaminotransferaza) -tgp|alt|tgp|gpt'],
  ['Creatinina', 'creatinina|creatinina serica'], ['eRFG', 'rfg - ckd-epi-2009|rfg|erfg|egfr'],
  ['Glicemie', 'glucoza|glicemie'], ['Sodiu', 'sodiu (na)|sodiu'], ['Potasiu', 'potasiu (k)|potasiu'],
  ['Calciu seric total', 'calciu seric total|calciu total|calciu'], ['Fosfor seric', 'fosfor seric|fosfor'],
  ['Uree', 'uree|uree serica'], ['Bilirubina totala', 'bilirubina totala'], ['Bilirubina directa', 'bilirubina directa'],
  ['Fosfataza alcalina', 'fosfataza alcalina'], ['Gama GT', 'gama gt|gamma gt|ggt'],
  ['LDH', 'ldh|lactat dehidrogenaza'], ['Creatinkinaza', 'creatinkinaza|creatin kinaza|ck'],
  ['Colesterol total', 'colesterol total'], ['LDL colesterol', 'ldl colesterol calculat|ldl colesterol'],
  ['HbA1c', 'hba1c (hemoglobina glicata)|hba1c'], ['Acid folic', 'acid folic'], ['Vitamina B12', 'vitamina b12'],
  ['FT4', 'ft4 (tiroxina libera)|ft4'], ['TSH', 'tsh|tsh (hormon tireostimulant)'], ['ANA SCREEN', 'ana screen'],
  ['Anti dsDNA IgG', 'anti dsdna igg'], ['ASLO cantitativ', 'aslo cantitativ|aslo'],
  ['Imunoglobulina A', 'imunoglobulina a'], ['Imunoglobulina M', 'imunoglobulina m'], ['Imunoglobulina G', 'imunoglobulina g'],
  ['Complement C3', 'complement c3'], ['Complement C4', 'complement c4'],
  ['Anticorpi totali anti-Treponema pallidum', 'anticorpi totali anti-treponema pallidum'],
  ['Ac Anti HCV', 'ac anti hcv|anticorpi anti hcv'], ['Antigen HBs', 'antigen hbs|aghbs'],
  ['Ac Anti HIV', 'ac anti hiv|anticorpi anti hiv|anticorpi anti-hiv|hiv|hiv ag/ac|hiv ag/ab|hiv combo'],
  ['Homocisteina', 'homocisteina'], ['Alfafetoproteina', 'afp|alfafetoproteina|alfa fetoproteina|afp (alfafetoproteina)'],
  ['CA 19-9', 'ca 19-9|ca 19-9 (cancer antigen 19-9)'], ['CEA', 'antigen carcinoembrionar|cea|cea (antigen carcinoembrionar)'], ['PSA', 'psa'],
  ['Sideremie', 'sideremie'], ['Feritina', 'feritina'], ['Parathormon', 'parathormon|pth'],
] as const;
const urine: Record<string, string> = { bil: 'Bilirubina', ubg: 'Urobilinogen', ket: 'Corpi cetonici', asc: 'Acid ascorbic', glu: 'Glucoza', pro: 'Proteine', ery: 'Eritrocite', ph: 'pH', nit: 'Nitriti', leu: 'Leucocite', sg: 'Densitate' };
const smear: Record<string, string> = { segmentat:'Segmentate', segmentate:'Segmentate', eozinofil:'Eozinofile', eozinofile:'Eozinofile', bazofil:'Bazofile', bazofile:'Bazofile', monocit:'Monocite', monocite:'Monocite', limfocit:'Limfocite', limfocite:'Limfocite' };
export function nameFor(raw: string, section: string) {
  const n = normalize(raw).replace(/\s*comentariu\s*$/, '').replace(/:$/, '').trim();
  if (section === 'urine') return urine[n] ?? clean(raw.replace(/^sediment\s*-\s*/i, '').replace(/:$/, ''));
  if (section === 'smear') return smear[n] ?? clean(raw.replace(/\*/g, ''));
  return TEMPLATE.find(([, aliases]) => aliases.split('|').includes(n))?.[0] ?? clean(raw.replace(/\*/g, ''));
}
export const templateRank = (name: string) => {
  const i = TEMPLATE.findIndex(([label]) => label === name);
  return i < 0 ? TEMPLATE.length : i;
};
