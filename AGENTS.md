<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Ward patients, favorites and local activity events live in the persisted Zustand store with skipHydration and effect-based rehydration; all patient/task mutations record events in the same state transaction — keeps SSR safe and records consistent changes without implying an authenticated audit trail.
- Imaging taxonomy lives in src/lib/imaging.ts, non-imaging presets and specialties in ward-data.ts; keep existing task keys and saved labels compatible when catalogs change — preserves old patient data while pickers expose only current entries.
- Optional contrast eligibility is shared by the imaging picker and task factory; picker choices are keyed per investigation — prevents unrelated rows from sharing a contrast choice and keeps saved tasks consistent.
- PatientCard uses separate laboratory and imaging InvestigationPicker popovers with direct CommandItem selection and a consult-only picker; non-imaging cardiac/endoscopy presets remain grouped in the laboratory picker, and legacy DRG storage stays backup-only — separates workflows without removing existing investigations or historical data.
- Export structured backups including patients, favorites and activity; validate imports and accept legacy patient arrays without clearing preferences or history — preserves device data during backup upgrades.
- Laboratory files are parsed in the browser with inert DOMParser and dynamically loaded PDF.js; keep results session-only, separate patient identities, and never use AI or send documents to a server — protects clinical data and ensures deterministic extraction.
- Laboratory series default to collection timestamp with session-only per-patient manual report ordering; semantic template keys reorder each section's analyses and section blocks while preserving units/ranges — makes manual ordering explicit without changing collection dates.
- Bulletin transfers change session-only patient assignment while retaining original identity and untouched source documents; reference exclusions remain report/result keyed — supports correction without concealing source provenance.
- Laboratory text uses a session-only Tiptap editor with HTML/plain-text clipboard and exports; reference exclusions are keyed by report and result index before formatting — preserves editable styles and never deletes clinical measurements when hiding ranges.
- Blood result series group by analysis and measurement unit, not reference range or exclusion; identical visible ranges appear once and differing visible ranges stay beside their own values — prevents repeated analysis names without misrepresenting normal ranges.
- Laboratory subsection headings determine smear ownership; hepatitis/HIV display conclusions come only from explicitly associated bulletin comments, retaining numeric measurements and source comments — prevents omitted smear results and invented assay interpretations.
- Load the AdSense verification/Auto ads script once in the root head — both features share one loader across all pages.
