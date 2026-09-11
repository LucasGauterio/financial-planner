# Phase 07: Monthly Income Registration & Projections

## Objective
Register recurring and one-off income sources (salary, dividends, received payments) and project them month-by-month — with monthly totals and a received/pending status per month — over a user-selectable horizon of up to 35 years.

## Technical Decisions
Sourced from [technical-decisions-monthly-income-tracker.md](../../decisions/technical-decisions-monthly-income-tracker.md) (all decided):

- **TD-01 (Data model):** Recurring rule + on-the-fly monthly derivation, with a sparse map of manually-confirmed month statuses persisted per source (no materialized 420-row schedule).
- **TD-02 (Recurrence):** Simple boolean `recurring` flag — monthly cadence only. Quarterly/annual dividends are registered as separate one-off entries.
- **TD-03 (Rendering):** User-selectable projection horizon (e.g. 1 / 5 / 10 / 35 years), defaulting to a short window, reusing the year-grouped list pattern from `InvestmentTimeline.vue`.
- **TD-04 (Default status):** Every projected month defaults to `pending` regardless of date; the user explicitly marks a month as `received` (same convention as `loanCalculations.js` installment status).

## Dependency Map
- Depends on Phase 01 (build/test scaffolding) and Phase 02 (zero-trust encrypted storage via `indexedDbRepository.js`).
- No dependency on Phases 03–06.

## Step Implementations (SIs)

### SI-01: Income Calculation Engine
- Implement pure functions in `src/services/incomeCalculations.js` (new):
  - `generateIncomeProjection(sources, horizonMonths, statusOverrides)` — per TD-01/TD-02, expands each income source (one-off or monthly-recurring) into per-month projected entries up to `horizonMonths`, applying any `statusOverrides` entry for that `{sourceId, "YYYY-MM"}`; unmarked months default to `status: 'pending'` (TD-04).
  - `calculateMonthlyTotals(projectionMonth)` — sums amounts for a given month's entries, split by `received` vs. `pending` totals.
- Target files:
  - `src/services/incomeCalculations.js` (new)
- Tests:
  - `src/services/incomeCalculations.test.js` (new) — cover one-off entries, monthly recurrence expansion, override application, default-pending behavior, and monthly totals across a multi-year horizon.
  - Run: `npx vitest run src/services/incomeCalculations.test.js`

### SI-02: Income Repository Integration
- Add an `INCOME_KEY` store following the existing key/get/set convention, including backup snapshot and raw export/import coverage.
- Target files:
  - [`src/services/indexedDbRepository.js`](../../../src/services/indexedDbRepository.js#L14-L19) (key constants)
  - [`src/services/indexedDbRepository.js`](../../../src/services/indexedDbRepository.js#L91-L123) (`get`/`set` — no change needed, generic by key)
  - [`src/services/indexedDbRepository.js`](../../../src/services/indexedDbRepository.js#L125-L296) (extend `saveBackupSnapshot`, `exportRawBackup`, `importRawBackup`, and the `repository` export with `getIncome`/`saveIncome`)
- Tests: `npx vitest run` (extend existing repository test coverage if present, otherwise cover via SI-03 component tests).

### SI-03: Income Tracker Vue Component
- Build `src/components/IncomeTracker.vue` (new):
  - Form to register an income source: name, amount, type (salary / dividend / payment — free-form label, no enum per TD-02 scope), start month, and a `recurring` checkbox (TD-02).
  - Horizon selector (1 / 5 / 10 / 35 years) driving `generateIncomeProjection`'s `horizonMonths` argument (TD-03).
  - Projection list grouped by year (reusing the grouped-list visual pattern from `InvestmentTimeline.vue`), each month row showing per-source amounts, a received/pending toggle per entry (defaulting to pending, TD-04), and a monthly total row (TD-01/`calculateMonthlyTotals`).
- Target files:
  - `src/components/IncomeTracker.vue` (new)
  - Reference pattern: [`src/components/InvestmentTimeline.vue`](../../../src/components/InvestmentTimeline.vue#L42-L75) (grouped-list rendering)
- Tests:
  - `src/components/IncomeTracker.test.js` (new)
  - Run: `npx vitest run src/components/IncomeTracker.test.js`

### SI-04: Navigation & i18n Integration
- Register a new top-level "Income" tab alongside `portfolio` / `timeline` / `loans` (not under the Simulations dropdown, since this is a tracker, not a hypothetical simulator).
- Target files:
  - [`src/App.vue`](../../../src/App.vue#L101-L107) (add tab button, `activeTab === 'income'`)
  - [`src/App.vue`](../../../src/App.vue#L110-L118) (render `<IncomeTracker v-else-if="activeTab === 'income'" />`)
  - [`src/App.vue`](../../../src/App.vue#L126-L137) (import `IncomeTracker` from `./components/IncomeTracker.vue`)
  - [`src/locales/pt-BR.js`](../../../src/locales/pt-BR.js#L6-L15) (add `tabs.income: 'Renda Mensal'` and any income-specific keys)
  - [`src/locales/en-US.js`](../../../src/locales/en-US.js#L1-L20) (mirror English keys — every key added to `pt-BR.js` MUST have an `en-US.js` counterpart per the Strict Bi-Lingual i18n rule)
- Tests: `npx vitest run` (full suite, confirm no regressions in tab switching / existing components).

## Deliverables
- `incomeCalculations.js` pure projection/aggregation engine with unit tests.
- Encrypted IndexedDB persistence for income sources and status overrides, integrated into the existing backup/export/import flow.
- `IncomeTracker.vue` component: registration form, horizon selector, and year-grouped received/pending projection list with monthly totals.
- New "Income" tab wired into `App.vue`, fully bilingual (`en-US` / `pt-BR`).
