# phase-12-spreadsheet-export — Progress

**Status:** completed
**SIs:** 3/3 completed

### SI-12.1 — Spreadsheet Export Service
- **Status:** completed
- **Tests:** 16 passing
- **Observations:**
  - Installed `xlsx` (SheetJS Community Edition) from SheetJS's own CDN tarball per `library-refs.md` — the project's first production dependency beyond `vue`. `npm install` shows the two pre-existing `EBADENGINE` warnings (local Node 25.2.1 vs `vitest@5`/`jsdom@30` engine ranges, already documented in ADR-016) and 2 pre-existing high-severity advisories, both from `@vue/test-utils` → `js-beautify`'s transitive chain (`brace-expansion`, `js-cookie`) — unrelated to `xlsx`, out of scope for this phase.
  - `buildTimelineRows` reimplements `InvestmentTimeline.vue`'s inline `generateTimeline` month-iteration loop as a pure function (it was never extracted to a service module in prior phases) — kept local to `spreadsheetExportService.js` rather than extracting a shared service, to stay within this phase's scope.

### SI-12.2 — Data Export Screen
- **Status:** completed
- **Tests:** 5 passing
- **Observations:**
  - The export horizon isn't user-configurable — fixed to 420 months (the app's own 35-year ceiling) so the export always covers every projected entry, independent of whatever horizon a tracker screen happens to have selected. Not called out as a separate TD since TD-02 already established the export always includes all data, not a filtered view.
  - `DataExport.test.js` needed an `afterEach(() => { document.body.innerHTML = '' })` — `ConfirmDialog`'s `Teleport to="body"` content otherwise leaks across tests within the same file (vitest's jsdom environment persists `document.body` across tests in one file), causing a later test's `document.body` queries to hit an earlier test's stale dialog. `LoanTracker.test.js`'s existing ConfirmDialog tests sidestep this by never asserting the dialog's absence — this is a real, reusable gap in that established pattern worth carrying into future component tests that Teleport to body.

### SI-12.3 — Navigation & i18n Integration
- **Status:** completed
- **Tests:** 169 passing (full suite, zero regressions)
- **Observations:**
  - `npm run build` succeeds; the bundle now shows a >500KB chunk-size warning, driven mostly by `xlsx` (SheetJS is a sizeable library). Code-splitting the Data Export screen behind a dynamic `import()` would address it, but no TD asked for that — out of scope for this phase, noted for a future phase if bundle size becomes a concern.
