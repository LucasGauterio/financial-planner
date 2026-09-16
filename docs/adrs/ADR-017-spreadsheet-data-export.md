# ADR-017: Spreadsheet Data Export (Phase 12)

- **Status**: Accepted
- **Date**: 2026-09-16
- **Deciders**: Core Engineering Team
- **Related decisions**: [technical-decisions-spreadsheet-export.md](../decisions/technical-decisions-spreadsheet-export.md) (TD-01 through TD-04)

---

## Context and Problem Statement

Phase 12 asks for a way to export every tracked financial domain — Income, Expenses, Loans, Portfolio, Cash Flow, and Investment Timeline — to a spreadsheet format the user can open outside the app (Excel, Google Sheets, LibreOffice). The app currently offers exactly one export path, `BackupManager.vue`'s "Export Backup," which downloads the vault's raw ciphertext (`repository.exportRawBackup()`) as `.json` — a round-trip artifact meant to be re-imported into the app, not read by a human. `package.json` declares a single production dependency (`vue`); no spreadsheet library exists in the project.

Two properties of the existing architecture shape this decision:
1. The app is 100% client-side with no backend — the workbook must be assembled and downloaded entirely in the browser.
2. All persisted data is AES-GCM encrypted at rest; a spreadsheet export is only useful if it is human-readable, which means it necessarily contains **decrypted plaintext** — the first user-initiated plaintext data egress path in the app's history.

---

## Decision

1. **Spreadsheet library**: adopt SheetJS Community Edition (`xlsx` npm package) as the project's first production dependency beyond `vue`. Its `XLSX.utils.json_to_sheet` / `XLSX.utils.book_append_sheet` / `XLSX.writeFile` API maps directly onto "array of plain objects → sheet → multi-sheet workbook → browser download," with `writeFile` handling the download itself (no manual `Blob`/anchor wiring, unlike the pattern `BackupManager.vue` uses for its JSON export).
2. **File structure**: a single multi-sheet `.xlsx` workbook, one tab per domain (`Income`, `Expenses`, `Loans`, `Portfolio`, `Cash Flow`, `Investment Timeline`), always including every domain — no per-domain file splitting, no zip, no user-selectable subset.
3. **Plaintext exposure**: the export is plaintext by design (spreadsheet apps can't open the vault's ciphertext), gated by a `ConfirmDialog.vue`-based warning (per [`dialog-implementation.md`](../../.claude/rules/dialog-implementation.md) — no native `confirm()`) that tells the user the downloaded file is unencrypted and should be stored/shared carefully, with explicit Cancel/Continue buttons before the download fires.
4. **Entry point**: a new dedicated "Data Export" screen, reachable from main navigation, built following the app's existing screen conventions (`.section-header`, `.card`, action button) rather than a button bolted onto `BackupManager.vue` — keeping the encrypted-vault-backup concern and the plaintext spreadsheet-export concern visually and conceptually separate.

New module: `src/services/spreadsheetExportService.js` — a pure function per domain (or one function taking all six domains' data) that maps each domain's stored shape to the flat row objects `XLSX.utils.json_to_sheet` expects, plus one function that assembles and triggers the workbook download. New component: `src/components/DataExport.vue`.

---

## Considered Alternatives

### Alternative A: ExcelJS instead of SheetJS
- **Rejected** — ExcelJS's imperative, row-by-row API (`worksheet.addRow()`) is more verbose for this phase's actual need (flat array of objects → sheet) and its browser build requires more setup than SheetJS's one-call `writeFile`. Its main advantage — richer cell styling — has no requirement driving it in this phase.

### Alternative B: Hand-rolled CSV, no new library, one file per domain
- **Rejected** — CSV has no concept of multiple tabs in one file, so it cannot satisfy "one sheet/tab per domain" without either six separate downloads or a manual zip step. Both are worse UX than the existing single-file "Export Backup" pattern this phase sits alongside, for the sake of avoiding one dependency.

### Alternative C: Zipped per-domain files (`.xlsx`/`.csv` + `jszip`)
- **Rejected** — trades one new dependency (a spreadsheet library) for two (spreadsheet library + zip library) without a requirement asking for independently portable per-domain files; a single workbook with six tabs already satisfies "export all data."

### Alternative D: User-selectable domain subset before export
- **Rejected** — the phase capability asks for exporting "all data," not a configurable subset; a checkbox-gated selection UI adds a step with no requirement driving it.

### Alternative E: Password-protect or encrypt the exported file
- **Rejected** — neither SheetJS Community Edition nor ExcelJS supports setting a native Excel open-password from the browser; wrapping the output in a password-protected zip would add a further dependency and force the user to manage a second password separate from their vault password, for a plaintext-export risk that is standard and accepted across comparable financial apps' CSV/XLSX export features. Mitigated procedurally instead, via the warning dialog in Decision §3.

### Alternative F: Bolt the export button onto `BackupManager.vue`
- **Rejected** — `BackupManager.vue`'s current purpose is specifically the encrypted vault backup/restore round-trip; adding a plaintext, human-readable export action to the same screen conflates two conceptually different data-egress operations with very different risk profiles. A dedicated screen keeps the distinction visible to the user.

---

## Consequences

### Positive
- Every tracked domain becomes portable to any spreadsheet application in one click, satisfying the phase capability with a single new dependency.
- The plaintext-egress risk introduced by this phase is surfaced explicitly to the user via a proper dialog component, consistent with [`dialog-implementation.md`](../../.claude/rules/dialog-implementation.md) and [`security_zero_trust.md`](../../.claude/rules/security_zero_trust.md).
- Keeping the export as a single all-domains workbook avoids building and testing selection-state UI with no requirement behind it.

### Negative
- `xlsx` becomes the project's first production dependency beyond `vue`, a precedent future phases should weigh before adding further third-party libraries to a codebase that has otherwise stayed dependency-minimal.
- The exported file itself carries no protection after download — the warning dialog is informational only, not a technical control. If a future phase needs stronger guarantees, revisit Alternative E.

---

## References
- [technical-decisions-spreadsheet-export.md](../decisions/technical-decisions-spreadsheet-export.md)
- [`BackupManager.vue`](../../src/components/BackupManager.vue) — existing export/backup screen pattern
- [`ConfirmDialog.vue`](../../src/components/ConfirmDialog.vue) — canonical dialog component
- [SheetJS documentation](https://docs.sheetjs.com/)
