export const MODALITIES = ['Radiografie', 'Ecografie', 'Doppler', 'CT', 'Angio-CT', 'RMN', 'Angio-RMN', 'PET-CT', 'SPECT-CT', 'Mamografie'] as const;
export type Modality = typeof MODALITIES[number];
export interface ImagingInvestigation { key: string; cat: 'imaging'; ro: string; en: string; modality: Modality; region: string }
const groups: [Modality, string, string[]][] = [
['Radiografie', 'Cap, față și gât', [
'Radiografie craniu','Radiografie sinusuri paranazale','Radiografie nas','Radiografie orbită','Radiografie mastoidă','Radiografie stâncă temporală','Radiografie mandibulă','Radiografie alte oase ale feței','Radiografie articulații temporo-mandibulare – gură deschisă','Radiografie articulații temporo-mandibulare – gură închisă','Radiografie glande salivare','Sialografie','Radiografie laringe','Radiografie apertură toracică și trahee']],
['Radiografie', 'Coloană și bazin', ['Radiografie coloană cervicală','Radiografie coloană toracală','Radiografie coloană lombosacrată','Radiografie coloană sacrococcigiană','Radiografie coloană vertebrală – trei regiuni','Radiografie articulații sacroiliace','Radiografie bazin']],
['Radiografie', 'Torace', ['Radiografie toracică','Radiografie toracică cu radioscopie','Radiografie coaste unilateral','Radiografie coaste bilateral','Radiografie stern','Radiografie stern și coaste unilateral','Radiografie stern și coaste bilateral']],
['Radiografie', 'Abdomen și aparat urinar', ['Radiografie abdomen','Radiografie renală simplă','Urografie intravenoasă','Pielografie','Pielografie intravenoasă','Pielografie anterogradă','Pielografie retrogradă','Cistografie retrogradă','Cistografie micțională','Cistografie de reflux','Uretrografie retrogradă','Uretrocistografie retrogradă și micțională','Uretrocistografie','Radiografie retrogradă a uretrei și vezicii urinare','Radiografie tract urinar cu substanță de contrast']],
['Radiografie', 'Tub digestiv și căi biliare', ['Tranzit baritat faringo-esofago-gastro-duodenal','Tranzit baritat intestin subțire','Tranzit baritat eso-gastro-duodenal cu urmărire până la colon','Clismă baritată','Clismă baritată a intestinului subțire','Bronhografie','Colecistografie']],
['Radiografie', 'Aparat genital', ['Histerosalpingografie','Examen radiologic uter și oviducte']],
['Radiografie', 'Oase și articulații', ['Radiografie claviculă','Radiografie umăr și scapulă','Radiografie articulație temporo-mandibulară', ...['antebraț','braț','cot','pumn','șold','genunchi'].flatMap(x => [`Radiografie ${x} drept`,`Radiografie ${x} stâng`]), ...['mână','coapsă','gambă','gleznă'].flatMap(x => [`Radiografie ${x} dreaptă`,`Radiografie ${x} stângă`]), ...['picior','calcaneu'].flatMap(x => [`Radiografie ${x} drept`,`Radiografie ${x} stâng`]), 'Radiografie întreg scheletul']],
['Radiografie', 'Imagistică dentară', ['Ortopantomografie','Radiografie panoramică dentară','Radiografie retroalveolară','Radiografie dentară','Radiografie bite-wing','Radiografie hemiarcadă','Radiografie mandibulă','Radiografie maxilar']],
['Radiografie', 'Alte investigații radiologice', ['Mielografie','Osteodensitometrie','Galactografie','Fistulografie']],
['Ecografie', 'Cap, gât și regiune cervicală', ['Ecografie transfontanelară','Ecografie conținut orbital','Ecografie unidimensională a conținutului orbital','Ecografie cervicală','Ecografie ganglionară','Ecografie glande salivare']],
['Ecografie', 'Cord', ['Ecocardiografie transtoracică','Ecocardiografie transesofagiană']],
['Ecografie', 'Abdomen și aparat urinar', ['Ecografie abdominală','Ecografie abdomino-pelvină','Ecografie tract urinar','Ecografie vezicală']],
['Ecografie', 'Pelvis și aparat genital', ['Ecografie pelvină la femeie','Ecografie pelvină la bărbat','Ecografie transrectală a prostatei, bazei vezicii și uretrei','Ecografie scrotală','Ecografie peniană']],
['Ecografie', 'Sân', ['Ecografie mamară unilaterală']],
['Ecografie', 'Torace', ['Ecografie toracică','Ecografie pleurală','Ecografie perete abdominal']],
['Ecografie', 'Aparat locomotor și părți moi', ['Ecografie musculoscheletală', ...['umăr','braț','antebraț','cot','mână','pumn','șold','coapsă','fesă','genunchi','gleznă','picior','membru inferior','regiune inghinală','tegument și țesut subcutanat','coloană vertebrală și măduva spinării','musculoscheletală intraoperatorie'].map(x=>`Ecografie ${x}`)]],
['Ecografie', 'Obstetrică', ['Ecografie obstetricală','Ecografie pentru depistarea malformațiilor fetale','Ecografie pentru evaluarea dezvoltării fetale','Ecografie abdominală sau pelvină în sarcină','Ecografie flux sanguin ombilical']],
['Doppler', 'Vase cervicale și cerebrale', ['Doppler carotido-vertebral','Doppler transcranian','Doppler duplex al vaselor intracraniene']],
['Doppler', 'Artere periferice', ['Doppler arterial membre inferioare','Doppler arterial membre superioare','Doppler arterial penian','Doppler arterial al corpilor cavernoși']],
['Doppler', 'Vene periferice', ['Doppler venos membre inferioare','Doppler venos membre superioare']],
['Doppler', 'Alte teritorii vasculare', ['Doppler vascular al cordonului ombilical','Doppler vascular al grefelor de bypass ale membrului superior']],
['Doppler', 'Imagistică de specialitate', ['Eco Doppler']],
['CT', 'Cap, creier și regiune cervicală', ['CT cerebral','CT craniu','CT fosă pituitară','CT sinusuri paranazale','CT orbită','CT orbită și creier','CT os facial','CT os facial și sinusuri paranazale','CT os facial, sinusuri paranazale și creier','CT buco-maxilo-facial','CT mastoidă','CT ureche medie și os temporal – unilateral','CT ureche medie și os temporal – bilateral','CT ureche medie, os temporal și creier – unilateral','CT ureche medie, os temporal și creier – bilateral','CT țesuturi moi cervicale']],
['CT', 'Coloană vertebrală', ['CT coloană cervicală','CT coloană toracală','CT coloană lombară','CT coloană vertebrală','CT coloană vertebrală cu contrast intratecal']],
['CT', 'Torace', ['CT torace','CT torace și abdomen']],
['CT', 'Abdomen și pelvis', ['CT abdomen','CT pelvis','CT abdomen și pelvis','CT torace, abdomen și pelvis','CT cerebral, torace și abdomen']],
['CT', 'Membre', ['CT membre','CT membru superior drept','CT membru superior stâng','CT membru inferior drept','CT membru inferior stâng','Pelvimetrie CT']],
['CT', 'Imagistică dentară CBCT', ['CBCT arcadă integrală maxilară','CBCT arcadă integrală mandibulară','CBCT bimaxilar','CBCT maxilar','CBCT mandibular','CBCT articulații temporo-mandibulare – unilateral','CBCT articulații temporo-mandibulare – bilateral','CBCT orbită – unilateral','CBCT orbită – bilateral','CBCT sinus maxilar – unilateral','CBCT sinus maxilar – bilateral','CBCT sinusuri paranazale','CBCT hemiarcadă','CBCT hemifacial','CBCT segmentar','CBCT unidentar','CBCT molar de minte inferior']],
['Angio-CT', 'Cap și gât', ['Angio-CT cerebral','Angio-CT cervical','Angio-CT cervico-cerebral']],
['Angio-CT', 'Torace și cord', ['Angio-CT toracic','Angio-CT coronarian']],
['Angio-CT', 'Abdomen și pelvis', ['Angio-CT abdominal','Angio-CT pelvin','Angio-CT aortă abdominală și ax iliofemural bilateral']],
['Angio-CT', 'Membre', ['Angio-CT membre','Angio-CT membru superior drept','Angio-CT membru superior stâng','Angio-CT membru inferior drept','Angio-CT membru inferior stâng']],
['RMN', 'Cap și sistem nervos', ['RMN cerebral','RMN hipofiză','RMN sinusuri paranazale','RMN cap']],
['RMN', 'Coloană vertebrală', ['RMN coloană cervicală','RMN coloană toracală','RMN coloană lombosacrată']],
['RMN', 'Gât', ['RMN gât','RMN regiune cervicală']],
['RMN', 'Torace și cord', ['RMN torace','RMN cord']],
['RMN', 'Abdomen și căi biliare', ['RMN abdominal','Colangio-RMN','RMN abdominal și colangio-RMN','Uro-RMN']],
['RMN', 'Pelvis și aparat genito-urinar', ['RMN pelvis','RMN pelvin','RMN șold – articulație coxofemurală']],
['RMN', 'Sân', ['RMN mamar bilateral']],
['RMN', 'Membre și articulații', ['RMN umăr drept','RMN umăr stâng','RMN umăr','RMN cot drept','RMN cot stâng','RMN genunchi drept','RMN genunchi stâng','RMN gleznă dreaptă','RMN gleznă stângă','RMN extremități – alte segmente']],
['RMN', 'Investigații extinse', ['RMN whole-body']],
['Angio-RMN', 'Cap și gât', ['Angio-RMN cerebral','Angio-RMN craniu','Angio-RMN cervical','Angio-RMN cervico-cerebral']],
['Angio-RMN', 'Torace', ['Angio-RMN toracic']],
['Angio-RMN', 'Abdomen și pelvis', ['Angio-RMN abdominal','Angio-RMN pelvin']],
['Angio-RMN', 'Membre', ['Angio-RMN membru superior drept','Angio-RMN membru superior stâng','Angio-RMN membru inferior drept','Angio-RMN membru inferior stâng','Angio-RMN coloană vertebrală']],
['PET-CT', 'General', ['PET-CT']],
['SPECT-CT', 'General', ['SPECT-CT']],
['Mamografie', 'Sân', ['Mamografie digitală 2D','Mamografie bilaterală în două planuri','Mamografie unilaterală în două planuri','Mamografie cu tomosinteză bilaterală','Mamografie cu tomosinteză unilaterală','Mamografie cu termografie bilaterală','Mamografie cu termografie unilaterală','Mamografie intraoperatorie bilaterală','Mamografie intraoperatorie unilaterală']],
];
export const imagingKey = (label: string) => 'img-' + label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '');
const seen = new Set<string>();
export const IMAGING: ImagingInvestigation[] = groups.flatMap(([modality, region, labels]) => labels.flatMap(ro => {
  const key = ro === 'Eco Doppler' ? 'doppler' : imagingKey(ro);
  if (seen.has(key)) return [];
  seen.add(key);
  return [{ key, cat: 'imaging' as const, ro, en: ro, modality, region }];
}));
export function filterImaging(favorites: string[], query = '', modality = 'all', region = 'all') {
  const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const q = normalize(query);
  return IMAGING.filter(i => (modality === 'all' || i.modality === modality) && (region === 'all' || i.region === region) && normalize(`${i.ro} ${i.modality} ${i.region}`).includes(q))
    .sort((a,b) => Number(favorites.includes(b.key)) - Number(favorites.includes(a.key)));
}
export function imagingTask(i: ImagingInvestigation, contrast: boolean) {
  return { kind: 'investigation' as const, key: i.key, label: i.ro, status: 'pending' as const, ...(i.modality === 'RMN' ? { contrast } : {}) };
}
