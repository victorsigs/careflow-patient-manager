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

- Ward data lives in a persisted Zustand store (src/lib/store.ts, localStorage, skipHydration + rehydrate in useEffect); presets/DRG/specialties in src/lib/ward-data.ts — keeps SSR hydration-safe and makes a later move to cloud sync a single-module swap.
- Consult and investigation pickers are filtered by task kind in PatientCard; preserve legacy DRG storage fields only for backup compatibility, with no DRG interface — avoids altering existing patient data during presentation changes.
