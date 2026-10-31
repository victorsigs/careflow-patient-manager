# Patient Manager (Romanian ward)

A ward board: each admitted patient shown as a card/row with their to-do list beside them. Data saved on this device only (browser storage); structured so it can move to online sync later for the team.

## Features
- **Patients**: add/edit/discharge. Fields: name, age, bed/salon, FO number (foaie de observatie), diagnosis, admission date, planned discharge date (with "days admitted" and overdue highlight).
- **To-do list per patient**: add from presets or free text, tick done, delete.
  - Investigation presets, color coded by category: Imaging (Eco Doppler, CT, IRM/MRI, Rx, Ecografie), Lab (Hemoleucograma, Biochimie, Coagulare, Hemocultura), Cardio (EKG, Ecocardiografie, Holter), Endoscopy (EDS, Colonoscopie).
  - Consults with specialty icon + color: Cardiologie, Neurologie, Chirurgie, ATI, Nefrologie, Gastro, Pneumologie, Diabet, Psihiatrie, ORL, Oftalmologie, Dermatologie, Infectioase.
  - Status: pending / scheduled / done, optional date.
- **DRG**: built-in searchable reference list of common Romanian DRG (AR-DRG v6 style) codes with description and relative value; attach codes to patients, shown as chips.
- **Board view**: search, filter (pending consults, discharge today/tomorrow), sort by bed or discharge date. Summary counts at top.
- **Language toggle** RO / EN, remembered on device.
- Export/import backup (JSON) since data is local only.

## Design
Clinical, calm: off-white background, deep teal primary, category colors for chips, compact dense layout for desktop and tablet. Fonts: IBM Plex Sans.

## Technical
- Single route `/` board; dialogs for add patient, add task, DRG picker.
- State via Zustand with localStorage persistence (hydrated client-side).
- Presets, specialties, DRG list in static data modules; i18n via simple dictionary.
- Sample DRG list is a reference subset, not the full official catalog.
