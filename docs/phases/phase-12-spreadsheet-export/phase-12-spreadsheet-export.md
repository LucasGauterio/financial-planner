# Phase 12: Spreadsheet Data Export

## Objective
Let a user export every tracked financial domain — Income, Expenses, Loans, Portfolio, Cash Flow, and Investment Timeline — to a single downloadable `.xlsx` workbook (one sheet/tab per domain), from a new dedicated Data Export screen, with an explicit warning before the plaintext download fires.

## Technical Decisions
Decided in [technical-decisions-spreadsheet-export.md](../../decisions/technical-decisions-spreadsheet-export.md), rationale recorded in [ADR-017](../../adrs/ADR-017-spreadsheet-data-export.md):

- **TD-01 (Spreadsheet generation library):** SheetJS Community Edition (`xlsx`) — `XLSX.utils.json_to_sheet` / `book_append_sheet` / `writeFile`. Installed from SheetJS's own CDN tarball, not the plain npm registry package — see [library-refs.md](library-refs.md).
- **TD-02 (Export scope & file structure):** a single multi-sheet `.xlsx` workbook, always all six domains, one click, one file — no per-domain splitting, no zip, no selectable subset.
- **TD-03 (Plaintext export exposure & warning):** the export is plaintext by necessity (a spreadsheet app can't open the vault's ciphertext); gated by a `ConfirmDialog.vue` warning (per [`dialog-implementation.md`](../../../.claude/rules/dialog-implementation.md) — no native `confirm()`) before the download fires.
- **TD-04 (Entry point & UI placement):** a new dedicated `DataExport.vue` screen, reachable from main navigation, separate from `BackupManager.vue`'s encrypted vault backup/restore concern.

**Inherited (unchanged):** the projection data models for Income/Expense (`generateIncomeProjection`/`generateExpenseProjection`, [`monthly-income-tracker/TD-01`](../../decisions/technical-decisions-monthly-income-tracker.md)) and Cash Flow (`buildCashFlowEntries`, [`cash-flow-overview/TD-02`](../../decisions/technical-decisions-cash-flow-overview.md)) are reused read-only by the export service — no changes to any tracker's storage shape.

## Dependency Map
- Depends on Phase 3 (Portfolio Tracker + Investment Timeline), Phase 6 (Loan Tracker), Phase 7/8 (Income/Expense Trackers), and Phase 9 (Cash Flow aggregation) — this phase only reads their existing repository data and service functions, never modifies them.
- SI-12.2 depends on SI-12.1 (the screen calls the export service).
- SI-12.3 depends on SI-12.2 (the component must exist before it can be routed to).

## Step Implementations (SIs)

### SI-12.1: Spreadsheet Export Service
- Implement `src/services/spreadsheetExportService.js` (new) per TD-01/TD-02, a pure module with no Vue/DOM dependency beyond the `xlsx` import:
  - One row-builder function per domain, each returning a flat array of plain objects (no nested objects/arrays — SheetJS's `json_to_sheet` renders nested values as `[object Object]`):
    - `buildIncomeRows(sources, horizonMonths)` / `buildExpenseRows(sources, horizonMonths)` — call [`generateIncomeProjection`](../../../src/services/incomeCalculations.js#L15-L54) / [`generateExpenseProjection`](../../../src/services/expenseCalculations.js#L15-L53) per source and flatten to `{ Source, Type, Month, Status, ExpectedAmount, ActualAmount }` rows.
    - `buildLoanRows(loans)` — one row per installment (credit loans, via [`generateCreditCardInstallments`](../../../src/services/loanCalculations.js#L15-L59) output already stored on the loan) or per payment (casual loans, `loan.payments`), each row `{ LoanName, Type, DueDate, Amount, Status }`.
    - `buildPortfolioRows(investments)` — one row per holding: `{ Name, Type, InvestedValue, Balance, MonthlyContribution, AnnualIncreasePercent, Rate, StartDate }` (field source: the `investments` array shape used by [`PortfolioTracker.vue`](../../../src/components/PortfolioTracker.vue#L415-L427)).
    - `buildCashFlowRows(incomeSources, expenseSources, horizonMonths)` — call [`buildCashFlowEntries`](../../../src/services/cashFlowCalculations.js) and flatten to `{ Kind, Source, Month, Status, Amount }`.
    - `buildTimelineRows(investments, stateMap)` — reimplements the month-iteration loop already inline in [`InvestmentTimeline.vue`'s `generateTimeline`](../../../src/components/InvestmentTimeline.vue#L152-L216) (historical start through 24 months ahead) as a pure function, joined with `stateMap[item.id]` for `{ checked, actualValue, reportedBalance }`, flattened to `{ Investment, Type, Month, ExpectedAmount, Status, ActualValue, ReportedBalance }`.
  - `exportAllToSpreadsheet(domainsData)` — takes the six pre-built row arrays, calls `XLSX.utils.json_to_sheet` per domain, `XLSX.utils.book_append_sheet` onto one `XLSX.utils.book_new()` workbook with tab names `Income`, `Expenses`, `Loans`, `Portfolio`, `Cash Flow`, `Investment Timeline` (all ≤31 chars, no reserved characters — see [library-refs.md](library-refs.md)), then `XLSX.writeFile(wb, `financial_planner_export_${date}.xlsx`)`.
  - An empty domain (no sources/loans/investments) still produces its sheet, with header row only (`json_to_sheet([])` on an explicit empty array is skipped — instead pass a single placeholder row shape or an explicit header array via `XLSX.utils.aoa_to_sheet` fallback when a domain's row array is empty, so the workbook always has exactly six tabs).
- Target files:
  - `src/services/spreadsheetExportService.js` (new)
- Tests:
  - `src/services/spreadsheetExportService.test.js` (new) — each `build*Rows` function: correct row count and field values for representative fixtures per domain, including the empty-input case (returns `[]`, not `undefined`/throws); `exportAllToSpreadsheet` calls `XLSX.writeFile` exactly once with a workbook containing exactly 6 sheets (mock `xlsx`'s `writeFile`/`utils.*` to assert call shape without triggering a real browser download in jsdom).
  - Run: `npx vitest run src/services/spreadsheetExportService.test.js`

### SI-12.2: Data Export Screen
- Build `src/components/DataExport.vue` (new) per TD-03/TD-04, following [`BackupManager.vue`](../../../src/components/BackupManager.vue)'s screen conventions (`.section-header`, `.card`, status-message pattern) per [`ui-pattern-consistency.md`](../../../.claude/rules/ui-pattern-consistency.md):
  - On mount, load every domain's data via `repository.getIncome()` / `getExpenses()` / `getLoans()` / `getInvestments()` / `getTimelineState()` independently (not shared state with other trackers), mirroring [`CashFlowOverview.vue`](../../../src/components/CashFlowOverview.vue)'s independent-load pattern.
  - A single "Export to Spreadsheet" action button. Clicking it opens a `ConfirmDialog` (`showExportConfirm`, per [`ConfirmDialog.vue`](../../../src/components/ConfirmDialog.vue) — no `@click.self` on the overlay, no `keydown.esc` listener) warning that the download will contain unencrypted financial data. Confirm calls `spreadsheetExportService.js`'s row-builders for all six domains, then `exportAllToSpreadsheet`; Cancel closes the dialog with no further action.
  - A status message area (mirroring `BackupManager.vue`'s `importMsg` convention) shows success/failure after the export attempt.
- Target files:
  - `src/components/DataExport.vue` (new)
  - Reference patterns: [`src/components/BackupManager.vue`](../../../src/components/BackupManager.vue), [`src/components/ConfirmDialog.vue`](../../../src/components/ConfirmDialog.vue)
- Tests:
  - `src/components/DataExport.test.js` (new) — clicking the export button opens the `ConfirmDialog`, not a native `confirm()`; the export service function is NOT called before the dialog is confirmed; confirming calls the export service with all six domains' data and closes the dialog; cancelling closes the dialog without calling the export service; a failure from the export service surfaces the status message.
  - Run: `npx vitest run src/components/DataExport.test.js`

### SI-12.3: Navigation & i18n Integration
- Register a new top-level "Data Export" tab alongside `portfolio`/`timeline`/`loans`/`income`/`expenses`/`cashFlow`.
- Target files:
  - [`src/App.vue`](../../../src/App.vue) (add tab button, `activeTab === 'dataExport'`, following the `cashFlow` tab button pattern; render `<DataExport v-else-if="activeTab === 'dataExport'" />`; import `DataExport` from `./components/DataExport.vue`)
  - `src/locales/en-US.js` / `src/locales/pt-BR.js` (add `tabs.dataExport`, mirroring the `tabs.cashFlow` key; add a `dataExport` i18n block — `title`, `subtitle`, `exportButton`, `confirmTitle`, `confirmMessage`, `statusSuccess`, `statusError` — mirroring the `backup`/`cashFlow` blocks' shape; every key added to `en-US.js` MUST have a `pt-BR.js` counterpart per the Strict Bi-Lingual i18n rule)
- Tests: `npx vitest run` (full suite, confirm no regressions in tab switching / existing components).

## Deliverables
- New pure `spreadsheetExportService.js` module: one row-builder per domain (Income, Expenses, Loans, Portfolio, Cash Flow, Investment Timeline) plus `exportAllToSpreadsheet`, with unit tests.
- New `DataExport.vue` screen: single-click export gated by an explicit `ConfirmDialog` plaintext-data warning, producing one `.xlsx` workbook with all six domains as separate tabs.
- `xlsx` (SheetJS Community Edition) added as the project's first production dependency beyond `vue`, installed per [library-refs.md](library-refs.md)'s CDN-tarball instructions (not the plain npm registry package).
- New "Data Export" tab wired into `App.vue`, fully bilingual (`en-US` / `pt-BR`).
