---
scope_type: phase
related_phases: [12]
status: decided
date: 2026-09-16
scope_description: "Export all tracked financial data (income, expenses, loans, portfolio, cash flow, investment timeline) to spreadsheet formats"
---

# Technical Decisions — Spreadsheet Data Export

_Subprojects in scope:_

- `./` (root Vue 3 SPA — single subproject, no backend) — owns every TD below; the app is 100% client-side, so export generation, file assembly, and download all happen in the browser.

---

## TD-01: Spreadsheet Generation Library

**Scope:** Cross-layer

**Capability:** Add a data-export capability that consolidates every tracked domain — Income sources & projections, Expense sources & projections, Loan Tracker entries & schedules, Portfolio Tracker holdings, Cash Flow Overview, and Investment Timeline entries — into a downloadable spreadsheet file, one sheet/tab per domain, exposed via a new dedicated Data Export screen.

**Context:** `package.json` currently declares a single production dependency (`vue`). No spreadsheet library exists in the project. Producing a real `.xlsx` workbook (not just delimited text) with one tab per domain requires a client-side library capable of building a multi-sheet workbook entirely in the browser, since there is no backend to offload the work to.

**Options:**

### Option A: SheetJS Community Edition (`xlsx` npm package)
- `XLSX.utils.json_to_sheet(rows)` converts each domain's array of plain objects directly into a worksheet; `XLSX.utils.book_append_sheet(wb, ws, name)` adds it to a workbook; `XLSX.writeFile(wb, filename)` serializes and triggers the browser download in one call — no manual Blob/anchor wiring needed.
- **Pros:** de facto standard for client-side spreadsheet generation, highest adoption and documentation coverage, minimal API surface for the exact array-of-objects → sheet → workbook → download flow this phase needs, no bundler-specific configuration required for a Vite/browser target.
- **Cons:** first production dependency beyond `vue`; write-side styling (colors, column widths) is limited in the Community Edition.

### Option B: ExcelJS
- A pure-JS workbook builder with a lower-level, imperative API (`workbook.addWorksheet()`, `worksheet.addRow()`) and richer cell styling/formatting support than SheetJS's Community Edition.
- **Pros:** stronger formatting control if the export ever needs styled headers, cell number formats, or column widths.
- **Cons:** more verbose for this phase's actual need (flat array of objects → sheet); larger bundle; browser build requires more setup than SheetJS's `writeFile` one-liner. No formatting requirement has been identified for this phase.

### Option C: Hand-rolled CSV (no library) + one file per domain
- Build delimited text manually per domain and download each as a separate `.csv` via the existing Blob+anchor pattern already used in `BackupManager.vue`.
- **Pros:** zero new dependency.
- **Cons:** CSV is not a true "spreadsheet format" (no tabs/sheets, no multiple domains in one file) and directly conflicts with the phase capability's "one sheet/tab per domain" requirement, which needs a real multi-sheet workbook container (`.xlsx`); would force either six separate downloads or a manual zip step, both worse UX than the existing single-file "Export Backup" pattern this phase sits alongside.

**Recommendation:** Option A — SheetJS's `json_to_sheet` / `book_append_sheet` / `writeFile` trio maps 1:1 onto "one sheet per domain, one downloadable file," requires no styling this phase doesn't need, and is the most-documented option for exactly this use case.

**Decision:** Option A — SheetJS Community Edition (`xlsx`)
**Libraries:** xlsx

---

## TD-02: Export Scope & File Structure

**Scope:** Cross-layer

**Capability:** Add a data-export capability that consolidates every tracked domain — Income sources & projections, Expense sources & projections, Loan Tracker entries & schedules, Portfolio Tracker holdings, Cash Flow Overview, and Investment Timeline entries — into a downloadable spreadsheet file, one sheet/tab per domain, exposed via a new dedicated Data Export screen.

**Context:** The phase capability says "all data" and "one sheet/tab per domain," but leaves open whether that means one consolidated file or several, and whether the user can narrow what gets included before exporting.

**Options:**

### Option A: Single multi-sheet `.xlsx` workbook, always all domains
- One button, one file, one download — every domain becomes a tab in the same workbook (`Income`, `Expenses`, `Loans`, `Portfolio`, `Cash Flow`, `Investment Timeline`).
- **Pros:** simplest UX, matches the single-click "Export Backup" pattern already in `BackupManager.vue`, no extra UI state to build or test.
- **Cons:** no way to export a subset of domains without opening the file afterward and deleting tabs.

### Option B: One file per domain (zipped)
- Generate six separate workbooks/CSVs and bundle them into a `.zip` before download, requiring an additional zip library (e.g. `jszip`).
- **Pros:** each domain is independently portable.
- **Cons:** second new dependency on top of TD-01's spreadsheet library; extra unzip step for the user; no real benefit over tabs within one workbook for this app's data volumes.

### Option C: User-selectable domain subset before export
- Add a small selection UI (checkboxes per domain) gating which sheets get included in the single workbook from Option A.
- **Pros:** flexibility for users who only want e.g. Loans data.
- **Cons:** the phase capability explicitly asks for exporting "all data," not a configurable subset; adds a modal/step with no requirement driving it.

**Recommendation:** Option A — a single all-domains `.xlsx` download directly satisfies the phase capability as written and mirrors the one-click export UX already established by `BackupManager.vue`'s "Export Backup" action.

**Decision:** Option A — single multi-sheet `.xlsx` workbook, always all domains

---

## TD-03: Plaintext Export Exposure & User Warning

**Scope:** Cross-layer

**Capability:** Add a data-export capability that consolidates every tracked domain [...] into a downloadable spreadsheet file [...], exposed via a new dedicated Data Export screen.

**Context:** The app's core architecture is a Zero-Trust Client Security vault — all financial data at rest is AES-GCM encrypted in IndexedDB, and the existing "Export Backup" button (`BackupManager.vue`) exports the still-encrypted raw ciphertext via `repository.exportRawBackup()`. A spreadsheet export is fundamentally different: to be readable in Excel/Sheets, it must contain decrypted plaintext financial data, so this phase introduces the app's first user-initiated plaintext data egress path. `.claude/rules/security_zero_trust.md` and `.claude/rules/dialog-implementation.md` both bear on how this exposure is surfaced.

**Options:**

### Option A: Plaintext `.xlsx` export, gated by an explicit in-app warning dialog
- Clicking "Export to Spreadsheet" opens a `ConfirmDialog.vue`-based warning (per `dialog-implementation.md` — no native `confirm()`) stating the file will contain unencrypted financial data and should be stored/shared carefully, with explicit Cancel/Continue buttons before the download fires.
- **Pros:** matches the industry norm for financial data export (banks/brokerages export unencrypted CSV/XLSX statements), no added dependency, keeps the export usable in any spreadsheet app without a password prompt.
- **Cons:** the resulting file itself carries no protection once downloaded — protection is purely informational/procedural.

### Option B: Password-protected output file
- Encrypt or password-protect the generated workbook itself (native Excel password protection, or wrapping it in a password-protected `.zip`).
- **Pros:** the file remains protected at rest after download, closer to the app's zero-trust posture.
- **Cons:** neither SheetJS Community Edition nor ExcelJS supports setting a native Excel open-password from the browser; would require an additional zip-with-password dependency and a password-entry UI, and the user would need to remember a second, separate password from their vault password.

**Recommendation:** Option A — it satisfies the capability without adding a dependency or new credential-management surface, and is consistent with how comparable financial apps handle data export; the risk is mitigated procedurally via a proper dialog component rather than technically.

**Decision:** Option A — plaintext export gated by a `ConfirmDialog.vue`-based warning

---

## TD-04: Entry Point & UI Placement

**Scope:** Cross-layer

**Capability:** Add a data-export capability that consolidates every tracked domain [...] into a downloadable spreadsheet file [...], exposed via a new dedicated Data Export screen.

**Context:** The export action needs a home in the UI. `.claude/rules/ui-pattern-consistency.md` requires checking an existing sibling screen's conventions before adding new UI — `BackupManager.vue` is the closest existing sibling (also a data-egress action) and its section-header / metric-row / card conventions are the reference to follow regardless of which option is chosen.

**Options:**

### Option A: New action button inside `BackupManager.vue`, next to "Export Backup"
- Add an "Export to Spreadsheet" button in the same panel/section as the existing `exportBackup()` action, reusing the component's existing button and status-message conventions.
- **Pros:** zero new screens; reuses an established, already-tested UI surface.
- **Cons:** crowds a screen whose current purpose is specifically vault backup/restore (encrypted round-trip data), conceptually mixing it with a human-readable plaintext export.

### Option B: New dedicated "Data Export" screen/tab
- A standalone screen reachable from main navigation, separate from `BackupManager.vue`, built following the app's existing screen conventions (`.section-header`, `.card`, action button per `ui-pattern-consistency.md`).
- **Pros:** keeps the encrypted-vault-backup concern (`BackupManager.vue`) and the human-readable plaintext export concern (this phase) visually and conceptually separate, matching TD-03's decision that this is a materially different, higher-exposure action deserving its own explicit surface; room for the export UI (domain summary, warning dialog trigger) without crowding the backup screen.
- **Cons:** one new nav entry, new i18n keys, and a new component to build and test, instead of reusing `BackupManager.vue` as-is.

**Recommendation:** Option A — directly reuses `BackupManager.vue`'s existing button/status-message pattern instead of introducing a new screen.

**Decision:** Option B — new dedicated Data Export screen, reachable from main navigation

---

## Decisions Summary

| ID | Scope | Decision | Recommendation | Choice |
|----|-------|----------|---------------|--------|
| TD-01 | Frontend | Spreadsheet Generation Library | SheetJS Community Edition (`xlsx`) | Option A |
| TD-02 | Frontend | Export Scope & File Structure | Single multi-sheet `.xlsx`, always all domains | Option A |
| TD-03 | Frontend | Plaintext Export Exposure & User Warning | Plaintext export gated by `ConfirmDialog.vue` warning | Option A |
| TD-04 | Frontend | Entry Point & UI Placement | New button inside `BackupManager.vue` | Option B |
