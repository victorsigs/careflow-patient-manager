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
- PatientCard uses a dedicated InvestigationPicker dialog and a consult-only picker; retain legacy DRG storage solely for backup compatibility with no DRG interface — separates workflows without altering historical data.
- Export structured backups including patients, favorites and activity; validate imports and accept legacy patient arrays without clearing preferences or history — preserves device data during backup upgrades.
