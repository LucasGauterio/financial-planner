# Phase 08: Monthly Expense Registration & Projections

## Objective
Register recurring and one-off expense sources (fixed bills, variable spending, subscriptions) and project them month-by-month — with monthly totals and a paid/pending status per month — over a user-selectable horizon of up to 35 years, mirroring the income tracker's data model.

## Technical Decisions
No new technical-decisions document was produced for this phase — `/research phase 08` determined the capability maps entirely onto TDs already decided in [technical-decisions-monthly-income-tracker.md](../../decisions/technical-decisions-monthly-income-tracker.md) (Phase 7). Reuse rationale recorded in [ADR-004](../../adrs/ADR-004-expense-tracker-pattern-reuse.md):

- **TD-01 (Data model, inherited):** Recurring rule + on-the-fly monthly derivation, with a sparse map of manually-confirmed month statuses persisted per source (no materialized 420-row schedule).
- **TD-02 (Recurrence, inherited):** Simple boolean `recurring` flag — monthly cadence only. Non-monthly bills are registered as separate one-off entries.
- **TD-03 (Rendering, inherited):** User-selectable projection horizon (e.g. 1 / 5 / 10 / 35 years), defaulting to a short window, reusing the year-grouped list pattern from `InvestmentTimeline.vue` / `IncomeTracker.vue`.
- **TD-04 (Default status, inherited):** Every projected month defaults to `pending` regardless of date; the user explicitly marks a month as `paid` (same convention as `incomeCalculations.js` / `loanCalculations.js` installment status).

## Dependency Map
- Depends on Phase 01 (build/test scaffolding), Phase 02 (zero-trust encrypted storage via `indexedDbRepository.js`), and Phase 07 (establishes the derived-projection pattern this phase mirrors — `incomeCalculations.js`, `IncomeTracker.vue`).
- No dependency on Phases 03–06.

## Step Implementations (SIs)

### SI-01: Expense Calculation Engine
- Implement pure functions in `src/services/expenseCalculations.js` (new), mirroring [`src/services/incomeCalculations.js`](../../../src/services/incomeCalculations.js#L1-L78) function-for-function:
  - `generateExpenseProjection(sources, horizonMonths, statusOverrides)` — per TD-01/TD-02, expands each expense source (one-off or monthly-recurring) into per-month projected entries up to `horizonMonths`, applying any `statusOverrides` entry for that `{sourceId, "YYYY-MM"}`; unmarked months default to `status: 'pending'` (TD-04).
  - `calculateMonthlyTotals(projectionMonth)` — sums amounts for a given month's entries, split by `paid` vs. `pending` totals.
- Target files:
  - `src/services/expenseCalculations.js` (new)
- Tests:
  - `src/services/expenseCalculations.test.js` (new) — cover one-off entries, monthly recurrence expansion, override application, default-pending behavior, and monthly totals across a multi-year horizon (mirror [`src/services/incomeCalculations.test.js`](../../../src/services/incomeCalculations.test.js) test cases, substituting `paid` for `received`).
  - Run: `npx vitest run src/services/expenseCalculations.test.js`

### SI-02: Expense Repository Integration
- Add an `EXPENSES_KEY` store following the existing key/get/set convention, including backup snapshot and raw export/import coverage.
- Target files:
  - [`src/services/indexedDbRepository.js`](../../../src/services/indexedDbRepository.js#L14-L19) (key constants — add `EXPENSES_KEY = 'financial_planner_expenses'`)
  - [`src/services/indexedDbRepository.js`](../../../src/services/indexedDbRepository.js#L91-L123) (`get`/`set` — no change needed, generic by key)
  - [`src/services/indexedDbRepository.js`](../../../src/services/indexedDbRepository.js#L125-L296) (extend `saveBackupSnapshot`, `exportRawBackup`, `importRawBackup`, and the `repository` export with `getExpenses`/`saveExpenses`, mirroring `getIncome`/`saveIncome` at [`L275-L276`](../../../src/services/indexedDbRepository.js#L275-L276))
- Tests: `npx vitest run` (extend existing repository test coverage if present, otherwise cover via SI-03 component tests).

### SI-03: Expense Tracker Vue Component
- Build `src/components/ExpenseTracker.vue` (new), mirroring [`src/components/IncomeTracker.vue`](../../../src/components/IncomeTracker.vue):
  - Form to register an expense source: name, amount, type (fixed bill / variable spending / subscription — free-form label, no enum per TD-02 scope), start month, and a `recurring` checkbox (TD-02).
  - Horizon selector (1 / 5 / 10 / 35 years) driving `generateExpenseProjection`'s `horizonMonths` argument (TD-03).
  - Projection list grouped by year (reusing the grouped-list visual pattern from `InvestmentTimeline.vue` / `IncomeTracker.vue`), each month row showing per-source amounts, a paid/pending toggle per entry (defaulting to pending, TD-04), and a monthly total row (TD-01/`calculateMonthlyTotals`).
- Target files:
  - `src/components/ExpenseTracker.vue` (new)
  - Reference pattern: [`src/components/IncomeTracker.vue`](../../../src/components/IncomeTracker.vue) (form + horizon selector + grouped projection list)
- Tests:
  - `src/components/ExpenseTracker.test.js` (new)
  - Run: `npx vitest run src/components/ExpenseTracker.test.js`

### SI-04: Navigation & i18n Integration
- Register a new top-level "Expenses" tab alongside `portfolio` / `timeline` / `loans` / `income` (not under the Simulations dropdown, since this is a tracker, not a hypothetical simulator).
- Target files:
  - [`src/App.vue`](../../../src/App.vue#L108-L114) (add tab button, `activeTab === 'expenses'`, following the `income` tab button pattern)
  - [`src/App.vue`](../../../src/App.vue#L124) (render `<ExpenseTracker v-else-if="activeTab === 'expenses'" />`)
  - [`src/App.vue`](../../../src/App.vue#L145) (import `ExpenseTracker` from `./components/ExpenseTracker.vue`)
  - [`src/locales/pt-BR.js`](../../../src/locales/pt-BR.js#L14) (add `tabs.expenses: 'Despesas Mensais'` and any expense-specific keys, mirroring the `income` block at [`L216`](../../../src/locales/pt-BR.js#L216))
  - [`src/locales/en-US.js`](../../../src/locales/en-US.js#L14) (mirror English keys — every key added to `pt-BR.js` MUST have an `en-US.js` counterpart per the Strict Bi-Lingual i18n rule; mirror the `income` block at [`L216`](../../../src/locales/en-US.js#L216))
- Tests: `npx vitest run` (full suite, confirm no regressions in tab switching / existing components).

## Deliverables
- `expenseCalculations.js` pure projection/aggregation engine with unit tests.
- Encrypted IndexedDB persistence for expense sources and status overrides, integrated into the existing backup/export/import flow.
- `ExpenseTracker.vue` component: registration form, horizon selector, and year-grouped paid/pending projection list with monthly totals.
- New "Expenses" tab wired into `App.vue`, fully bilingual (`en-US` / `pt-BR`).
