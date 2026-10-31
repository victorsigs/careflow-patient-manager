import {
  Heart, Brain, Scissors, Activity, Droplets, Pill, Wind, Syringe, Smile, Ear, Eye, Hand, Bug, Bone, Baby,
  type LucideIcon,
} from "lucide-react";

export type Lang = "ro" | "en";

export type InvCategory = "imaging" | "lab" | "cardio" | "endo" | "other";

export const INV_CATEGORIES: Record<InvCategory, { ro: string; en: string; color: string }> = {
  imaging: { ro: "Imagistică", en: "Imaging", color: "var(--cat-imaging)" },
  lab: { ro: "Laborator", en: "Lab", color: "var(--cat-lab)" },
  cardio: { ro: "Cardio", en: "Cardio", color: "var(--cat-cardio)" },
  endo: { ro: "Endoscopie", en: "Endoscopy", color: "var(--cat-endo)" },
  other: { ro: "Altele", en: "Other", color: "var(--cat-other)" },
};

export const INVESTIGATIONS: { key: string; cat: InvCategory; ro: string; en: string }[] = [
  { key: "doppler", cat: "imaging", ro: "Eco Doppler", en: "Doppler ultrasound" },
  { key: "ct", cat: "imaging", ro: "CT", en: "CT scan" },
  { key: "angioct", cat: "imaging", ro: "Angio-CT", en: "CT angiography" },
  { key: "mri", cat: "imaging", ro: "IRM", en: "MRI" },
  { key: "rx", cat: "imaging", ro: "Radiografie", en: "X-ray" },
  { key: "eco", cat: "imaging", ro: "Ecografie abdominală", en: "Abdominal ultrasound" },
  { key: "hlg", cat: "lab", ro: "Hemoleucogramă", en: "Complete blood count" },
  { key: "bio", cat: "lab", ro: "Biochimie", en: "Biochemistry panel" },
  { key: "coag", cat: "lab", ro: "Coagulare (INR, aPTT)", en: "Coagulation (INR, aPTT)" },
  { key: "hemoc", cat: "lab", ro: "Hemocultură", en: "Blood culture" },
  { key: "uro", cat: "lab", ro: "Urocultură", en: "Urine culture" },
  { key: "gaz", cat: "lab", ro: "Astrup", en: "Blood gases" },
  { key: "ekg", cat: "cardio", ro: "EKG", en: "ECG" },
  { key: "ecocord", cat: "cardio", ro: "Ecocardiografie", en: "Echocardiography" },
  { key: "holter", cat: "cardio", ro: "Holter EKG", en: "Holter ECG" },
  { key: "eds", cat: "endo", ro: "Endoscopie digestivă superioară", en: "Upper GI endoscopy" },
  { key: "colono", cat: "endo", ro: "Colonoscopie", en: "Colonoscopy" },
  { key: "bronho", cat: "endo", ro: "Bronhoscopie", en: "Bronchoscopy" },
];

export const SPECIALTIES: { key: string; ro: string; en: string; color: string; icon: LucideIcon }[] = [
  { key: "cardio", ro: "Cardiologie", en: "Cardiology", color: "var(--sp-cardio)", icon: Heart },
  { key: "neuro", ro: "Neurologie", en: "Neurology", color: "var(--sp-neuro)", icon: Brain },
  { key: "surg", ro: "Chirurgie", en: "Surgery", color: "var(--sp-surg)", icon: Scissors },
  { key: "ati", ro: "ATI", en: "ICU / Anaesthesia", color: "var(--sp-ati)", icon: Activity },
  { key: "nefro", ro: "Nefrologie", en: "Nephrology", color: "var(--sp-nefro)", icon: Droplets },
  { key: "gastro", ro: "Gastroenterologie", en: "Gastroenterology", color: "var(--sp-gastro)", icon: Pill },
  { key: "pneumo", ro: "Pneumologie", en: "Pulmonology", color: "var(--sp-pneumo)", icon: Wind },
  { key: "diabet", ro: "Diabet", en: "Diabetology", color: "var(--sp-diabet)", icon: Syringe },
  { key: "psih", ro: "Psihiatrie", en: "Psychiatry", color: "var(--sp-psih)", icon: Smile },
  { key: "orl", ro: "ORL", en: "ENT", color: "var(--sp-orl)", icon: Ear },
  { key: "oftalmo", ro: "Oftalmologie", en: "Ophthalmology", color: "var(--sp-oftalmo)", icon: Eye },
  { key: "derma", ro: "Dermatologie", en: "Dermatology", color: "var(--sp-derma)", icon: Hand },
  { key: "infect", ro: "Boli infecțioase", en: "Infectious diseases", color: "var(--sp-infect)", icon: Bug },
  { key: "orto", ro: "Ortopedie", en: "Orthopaedics", color: "var(--sp-orto)", icon: Bone },
  { key: "gine", ro: "Obstetrică-Ginecologie", en: "Obstetrics-Gynaecology", color: "var(--sp-gine)", icon: Baby },
];

// Reference subset in AR-DRG v6 style. Not the official complete catalog.
export const DRGS: { code: string; ro: string; en: string; rw: number }[] = [
  { code: "B70B", ro: "AVC cu CC severe", en: "Stroke w severe CC", rw: 2.13 },
  { code: "B70D", ro: "AVC fără CC", en: "Stroke w/o CC", rw: 1.18 },
  { code: "B76B", ro: "Convulsii fără CC catastrofale", en: "Seizures w/o catastrophic CC", rw: 0.85 },
  { code: "E62B", ro: "Infecții/inflamații respiratorii cu CC severe", en: "Respiratory infections w severe CC", rw: 1.62 },
  { code: "E62C", ro: "Infecții/inflamații respiratorii fără CC", en: "Respiratory infections w/o CC", rw: 0.93 },
  { code: "E65B", ro: "BPOC fără CC catastrofale", en: "COPD w/o catastrophic CC", rw: 1.02 },
  { code: "E61B", ro: "Embolism pulmonar fără CC catastrofale", en: "Pulmonary embolism w/o catastrophic CC", rw: 1.41 },
  { code: "F62B", ro: "Insuficiență cardiacă și șoc fără CC catastrofale", en: "Heart failure & shock w/o catastrophic CC", rw: 1.21 },
  { code: "F60B", ro: "Tulburări circulatorii cu IMA fără proceduri invazive", en: "Circulatory disorders w AMI w/o invasive procedures", rw: 1.33 },
  { code: "F71B", ro: "Aritmii și tulburări de conducere fără CC", en: "Arrhythmia & conduction disorders w/o CC", rw: 0.64 },
  { code: "F63B", ro: "Tromboză venoasă fără CC catastrofale", en: "Venous thrombosis w/o catastrophic CC", rw: 0.87 },
  { code: "F67B", ro: "Hipertensiune fără CC", en: "Hypertension w/o CC", rw: 0.58 },
  { code: "G61B", ro: "Hemoragie digestivă fără CC catastrofale", en: "GI haemorrhage w/o catastrophic CC", rw: 0.81 },
  { code: "G67B", ro: "Esofagită/gastroenterită fără CC", en: "Oesophagitis/gastroenteritis w/o CC", rw: 0.52 },
  { code: "H60B", ro: "Ciroză și hepatită alcoolică cu CC severe", en: "Cirrhosis & alcoholic hepatitis w severe CC", rw: 1.48 },
  { code: "H62B", ro: "Afecțiuni pancreatice fără CC catastrofale", en: "Pancreas disorders w/o catastrophic CC", rw: 0.96 },
  { code: "H08B", ro: "Colecistectomie laparoscopică fără CC", en: "Laparoscopic cholecystectomy w/o CC", rw: 1.12 },
  { code: "G07B", ro: "Apendicectomie fără CC", en: "Appendicectomy w/o CC", rw: 0.98 },
  { code: "I08B", ro: "Alte proceduri pe șold și femur", en: "Other hip & femur procedures", rw: 2.21 },
  { code: "K60B", ro: "Diabet fără CC catastrofale", en: "Diabetes w/o catastrophic CC", rw: 0.78 },
  { code: "L60B", ro: "Insuficiență renală cu CC severe", en: "Renal failure w severe CC", rw: 1.36 },
  { code: "L63B", ro: "Infecții ale rinichiului și tractului urinar fără CC", en: "Kidney & urinary tract infections w/o CC", rw: 0.67 },
  { code: "T60B", ro: "Septicemie fără CC catastrofale", en: "Septicaemia w/o catastrophic CC", rw: 1.55 },
  { code: "J64B", ro: "Celulită fără CC catastrofale", en: "Cellulitis w/o catastrophic CC", rw: 0.71 },
  { code: "Q61B", ro: "Tulburări ale eritrocitelor fără CC", en: "Red blood cell disorders w/o CC", rw: 0.62 },
  { code: "U61B", ro: "Tulburări schizofrenice", en: "Schizophrenia disorders", rw: 1.87 },
];
