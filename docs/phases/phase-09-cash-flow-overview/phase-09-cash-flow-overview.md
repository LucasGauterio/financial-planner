# Phase 09: Editable Actual Amounts & Consolidated Cash Flow Overview

## Objective
Let a user record the actual amount received/paid for an Income or Expense projection entry once it's marked Received/Paid (mirroring the Investment Timeline's mark-as-Done editable amount), and add a new Cash Flow Overview screen that lists Income and Expense projections together in one month-by-month view with combined Pending/Paid/Received totals.

## Technical Decisions
Decided in [technical-decisions-cash-flow-overview.md](../../decisions/technical-decisions-cash-flow-overview.md), rationale recorded in [ADR-007](../../adrs/ADR-007-cash-flow-overview.md):

- **TD-01 (Actual amount storage):** `statusOverrides[month]` is upgraded from a plain string to `{ status, actualAmount }`. Every read site treats a legacy `typeof value === 'string'` entry as `{ status: value, actualAmount: null }` — no destructive migration. The projection entry's resolved amount uses `actualAmount` in place of the registered amount whenever status is received/paid and `actualAmount` is set.
- **TD-02 (Cash Flow Overview composition):** a new pure service module `cashFlowCalculations.js` merges `generateIncomeProjection`/`generateExpenseProjection` output (tagged `kind: 'income' | 'expense'`) and derives combined monthly totals; `CashFlowOverview.vue` reads sources from the repository directly, independent of the other trackers' in-memory state.
- **TD-03 (Cash Flow Overview interactivity):** the overview is fully interactive — each row exposes the same status-toggle and actual-amount edit controls as the owning tracker, persisting back through `repository.saveIncome`/`saveExpenses`. Rationale (user): a one-stop screen to review and correct the whole month's cash flow is worth duplicating the controls.

**Inherited (unchanged):** the projection data model (recurring rule + on-the-fly derivation + sparse overrides, [`monthly-income-tracker/TD-01`](../../decisions/technical-decisions-monthly-income-tracker.md)), the manual-only pending default ([`monthly-income-tracker/TD-04`](../../decisions/technical-decisions-monthly-income-tracker.md)), and the edit-discards-overrides guard on `startMonth`/`recurring`/`endMonth` changes ([`tracker-source-edit-delete/TD-02`](../../decisions/technical-decisions-tracker-source-edit-delete.md)) — which now discards the upgraded `{status, actualAmount}` shape unchanged.

## Dependency Map
- Depends on Phase 04 (Investment Timeline — establishes the mark-as-Done editable-amount pattern this phase mirrors), Phase 07 (Income Tracker), and Phase 08 (Expense Tracker).
- SI-02 depends on SI-01 (extends `generateIncomeProjection`/`generateExpenseProjection`).
- SI-03 has no dependency on SI-01/SI-02 (it composes the existing projection functions as-is; TD-01's amount resolution happens inside those functions, transparent to the aggregator).
- SI-04 depends on SI-03 (aggregation service) and reuses SI-02's toggle/edit interaction shape.
- SI-05 depends on SI-04 (the component must exist before it can be routed to).

## Step Implementations (SIs)

### SI-01: Actual Amount Storage & Resolution
- Extend [`generateIncomeProjection`](../../../src/services/incomeCalculations.js#L15-L54) and [`generateExpenseProjection`](../../../src/services/expenseCalculations.js#L15-L53) per TD-01: read `statusOverrides[key]`; if it's a string, treat it as `{ status: value, actualAmount: null }` (legacy fallback); if it's an object, use its `status`/`actualAmount` directly. Each emitted entry keeps `expectedAmount` (the source's registered `amount`, unchanged) and resolves `amount` to `actualAmount` when the resolved status is `received`/`paid` and `actualAmount` is not null/undefined, otherwise `amount` stays equal to `expectedAmount`.
- [`calculateMonthlyTotals`](../../../src/services/incomeCalculations.js#L62-L77) needs no code change — it already sums `entry.amount` by status, which now already reflects the resolved actual amount.
- Target files:
  - [`src/services/incomeCalculations.js`](../../../src/services/incomeCalculations.js#L15-L54)
  - [`src/services/expenseCalculations.js`](../../../src/services/expenseCalculations.js#L15-L53)
- Tests:
  - `src/services/incomeCalculations.test.js` (extend) — a legacy string override (`'received'`) still resolves `status: 'received'`, `amount === expectedAmount`; an object override `{status: 'received', actualAmount: N}` resolves `amount === N`; an object override with `actualAmount: null` falls back to the expected amount; `calculateMonthlyTotals` reflects the resolved amount, not the expected one, when they differ.
  - `src/services/expenseCalculations.test.js` (extend) — same cases, substituting `paid` for `received`.
  - Run: `npx vitest run src/services/incomeCalculations.test.js src/services/expenseCalculations.test.js`

### SI-02: Actual Amount Edit UI (Income & Expense Trackers)
- Update `toggleStatus` in [`IncomeTracker.vue`](../../../src/components/IncomeTracker.vue#L348-L358) and its `ExpenseTracker.vue` counterpart to write/read the `{status, actualAmount}` shape: toggling to received/paid sets `actualAmount` to the previously-recorded value if any, else defaults it to `entry.expectedAmount` (mirroring [`InvestmentTimeline.vue`'s `toggleCheck`](../../../src/components/InvestmentTimeline.vue#L136-L150) defaulting logic); toggling back to pending keeps the stored `actualAmount` (hidden, not discarded) so re-marking received/paid restores it, same as Timeline.
- Add an editable `<input type="number">` next to the status-toggle button, rendered only when `entry.status !== 'pending'`, bound to the source's `statusOverrides[entry.month].actualAmount`, persisting on `@blur` via `repository.saveIncome`/`saveExpenses` — mirroring [`InvestmentTimeline.vue`'s `actualValue` input](../../../src/components/InvestmentTimeline.vue#L53) including the `step="0.01"` and the `999999999999999` clamp.
- Add `income.actualAmount` / `expenses.actualAmount` label keys.
- Target files:
  - [`src/components/IncomeTracker.vue`](../../../src/components/IncomeTracker.vue#L66-L81) (template row), [`#L348-L358`](../../../src/components/IncomeTracker.vue#L348-L358) (`toggleStatus`)
  - `src/components/ExpenseTracker.vue` (mirror the same two spots)
  - [`src/locales/en-US.js`](../../../src/locales/en-US.js#L233-L239) / [`src/locales/pt-BR.js`](../../../src/locales/pt-BR.js) (`income.actualAmount`, under the existing `income` block near `received`/`pending`)
  - [`src/locales/en-US.js`](../../../src/locales/en-US.js#L266-L272) / [`src/locales/pt-BR.js`](../../../src/locales/pt-BR.js) (`expenses.actualAmount`, mirrored)
- Tests:
  - `src/components/IncomeTracker.test.js` (extend) — toggling an entry to received reveals the actual-amount input defaulting to the expected amount; editing and blurring calls `repository.saveIncome` with the updated `actualAmount`; toggling back to pending hides the input without clearing the stored value; the month's total reflects the edited actual amount.
  - `src/components/ExpenseTracker.test.js` (extend) — same cases, substituting `paid` for `received`.
  - Run: `npx vitest run src/components/IncomeTracker.test.js src/components/ExpenseTracker.test.js`

### SI-03: Cash Flow Aggregation Service
- Implement `src/services/cashFlowCalculations.js` (new) per TD-02:
  - `buildCashFlowEntries(incomeSources, expenseSources, horizonMonths)` — calls `generateIncomeProjection`/`generateExpenseProjection` (reading each source's own `statusOverrides`, per SI-01's resolution), tags each resulting entry with `kind: 'income'` or `kind: 'expense'`, merges both arrays, and sorts by `month`.
  - `calculateCombinedMonthlyTotals(monthEntries)` — sums a month's merged entries into `{ pending, paid, received, total }`: `pending` sums every entry (either kind) with `status === 'pending'`; `received` sums `kind === 'income'` entries with `status === 'received'`; `paid` sums `kind === 'expense'` entries with `status === 'paid'`; `total` is the sum of all three.
- Target files:
  - `src/services/cashFlowCalculations.js` (new)
- Tests:
  - `src/services/cashFlowCalculations.test.js` (new) — merges and sorts income+expense entries by month; combined totals correctly separate pending/paid/received across kinds; empty income or empty expense sources still produce the other domain's entries; totals reflect SI-01's resolved actual amounts, not expected amounts, when they differ.
  - Run: `npx vitest run src/services/cashFlowCalculations.test.js`

### SI-04: Cash Flow Overview Vue Component
- Build `src/components/CashFlowOverview.vue` (new), per TD-02/TD-03, mirroring [`IncomeTracker.vue`](../../../src/components/IncomeTracker.vue)'s grouped-list layout and horizon selector:
  - On mount, load sources independently via `repository.getIncome()` and `repository.getExpenses()` (not shared state with the other two components).
  - Reuse the horizon selector (1/5/10/35 years) and year/month-grouped list rendering pattern.
  - Each merged entry row shows its `kind` (income/expense, e.g. via a small label or color accent), name, amount, and the same status-toggle + actual-amount edit controls as SI-02 — committing a change calls `repository.saveIncome` when `entry.kind === 'income'` or `repository.saveExpenses` when `entry.kind === 'expense'`.
  - Each month's header shows combined `Pending` / `Paid` / `Received` totals from `calculateCombinedMonthlyTotals`.
- Target files:
  - `src/components/CashFlowOverview.vue` (new)
  - Reference patterns: [`src/components/IncomeTracker.vue`](../../../src/components/IncomeTracker.vue), `src/components/ExpenseTracker.vue`
- Tests:
  - `src/components/CashFlowOverview.test.js` (new) — renders merged income+expense entries in one list, grouped by month; toggling an income entry calls `repository.saveIncome`, toggling an expense entry calls `repository.saveExpenses`; the actual-amount input appears/persists the same way as SI-02; the month header totals match `cashFlowCalculations.js` output.
  - Run: `npx vitest run src/components/CashFlowOverview.test.js`

### SI-05: Navigation & i18n Integration
- Register a new top-level "Cash Flow" tab alongside `portfolio`/`timeline`/`loans`/`income`/`expenses`.
- Target files:
  - [`src/App.vue`](../../../src/App.vue#L115-L121) (add tab button, `activeTab === 'cashFlow'`, following the `expenses` tab button pattern)
  - [`src/App.vue`](../../../src/App.vue#L132) (render `<CashFlowOverview v-else-if="activeTab === 'cashFlow'" />`)
  - [`src/App.vue`](../../../src/App.vue#L154) (import `CashFlowOverview` from `./components/CashFlowOverview.vue`)
  - [`src/locales/pt-BR.js`](../../../src/locales/pt-BR.js) / [`src/locales/en-US.js`](../../../src/locales/en-US.js#L14-L15) (add `tabs.cashFlow`, mirroring the `tabs.expenses` key at [`L15`](../../../src/locales/en-US.js#L15); add a `cashFlow` i18n block — `title`, `subtitle`, `empty`, `emptyProjection`, `horizon`, `sourcesCount`-equivalent copy if needed — mirroring the `income`/`expenses` blocks at [`L218-L284`](../../../src/locales/en-US.js#L218-L284); every key added to `en-US.js` MUST have a `pt-BR.js` counterpart per the Strict Bi-Lingual i18n rule)
- Tests: `npx vitest run` (full suite, confirm no regressions in tab switching / existing components).

## Deliverables
- `statusOverrides` upgraded to `{status, actualAmount}` (with transparent legacy-string fallback) across `incomeCalculations.js` and `expenseCalculations.js`, with actual amounts feeding monthly totals in place of expected amounts.
- Editable actual-amount input in both `IncomeTracker.vue` and `ExpenseTracker.vue`, appearing once an entry is marked Received/Paid, mirroring `InvestmentTimeline.vue`'s mark-as-Done pattern.
- `cashFlowCalculations.js` pure aggregation engine (merged projections + combined Pending/Paid/Received monthly totals) with unit tests.
- New `CashFlowOverview.vue` screen: a single month-by-month list combining Income and Expense projections, fully interactive (status toggle + actual-amount edit per entry).
- New "Cash Flow" tab wired into `App.vue`, fully bilingual (`en-US` / `pt-BR`).
