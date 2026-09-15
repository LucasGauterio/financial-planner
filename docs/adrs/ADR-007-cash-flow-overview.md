# ADR-007: Editable Actual Amounts & Consolidated Cash Flow Overview

- **Status**: Accepted
- **Date**: 2026-09-14
- **Deciders**: Core Engineering Team
- **Related decisions**: ADR-004 (Expense Tracker Persistence & Projection Layer — Reuse of Income Tracker Pattern), ADR-006 (Income/Expense Source Edit & Delete — Reuse of Loan Tracker Interaction Pattern), [Technical Decisions — Editable Actual Amounts & Consolidated Cash Flow Overview](../decisions/technical-decisions-cash-flow-overview.md)

---

## Context and Problem Statement

Both `IncomeTracker.vue` (Phase 7) and `ExpenseTracker.vue` (Phase 8) only let a user flip a projection entry between `pending` and `received`/`paid` — there is no way to record what amount was *actually* received or paid when it differs from the registered expected amount. [`InvestmentTimeline.vue`](../../src/components/InvestmentTimeline.vue#L122-L147) already solved the equivalent problem for investment contributions: marking an item "Done" reveals an editable `actualValue` input, defaulting to the expected value, persisted via `saveState()`. Separately, income and expense projections live in two fully independent components with no combined view of the month's total cash flow (pending/paid/received across both domains at once).

---

## Decision

Per [technical-decisions-cash-flow-overview.md](../decisions/technical-decisions-cash-flow-overview.md):

1. **Actual amount storage shape (TD-01, Option A)** — each source's `statusOverrides[month]` value is upgraded from a plain string (`'received' | 'pending'` / `'paid' | 'pending'`) to an object `{ status, actualAmount }`. Every read site treats a `typeof value === 'string'` entry as `{ status: value, actualAmount: null }`, mirroring the exact legacy-shape fallback [`InvestmentTimeline.vue`](../../src/components/InvestmentTimeline.vue#L122-L126) already performs for its own boolean → object migration. When an entry is toggled to received/paid, the actual-amount input defaults to the entry's expected `amount` (same default behavior as Timeline's `actualValue`, [`InvestmentTimeline.vue#L141`](../../src/components/InvestmentTimeline.vue#L141)) and the persisted `actualAmount` — not the expected amount — feeds `calculateMonthlyTotals`.
2. **Cash Flow Overview composition (TD-02, Option A)** — a new pure service module `src/services/cashFlowCalculations.js` imports `generateIncomeProjection`/`generateExpenseProjection` (and their expense counterpart), tags each entry with `kind: 'income' | 'expense'`, merges and sorts by month, and derives combined monthly Pending/Paid/Received totals. This follows the same pure-service-module convention as `financialCalculations.js`, `loanCalculations.js`, `incomeCalculations.js`, and `expenseCalculations.js` — each with its own `.test.js` — rather than embedding aggregation logic in a component.
3. **Cash Flow Overview interactivity (TD-03, Option B)** — the new `CashFlowOverview.vue` screen is fully interactive: each row exposes the same status-toggle and actual-amount edit controls as the owning tracker, persisting back through `repository.saveIncome`/`repository.saveExpenses` for that entry's source. This duplicates interactive logic across three components by user decision, trading a larger surface area to keep in sync for a one-stop screen that avoids tab-switching between Income Tracker and Expense Tracker to correct an entry.
4. **New tab wiring** — `App.vue` gains a `cashFlow` tab rendering `CashFlowOverview.vue`, following the existing `v-else-if="activeTab === '...'"` pattern already used for `loans`/`income`/`expenses` ([`App.vue#L130-L132`](../../src/App.vue#L130-L132)).

---

## Considered Alternatives

### Alternative A: Parallel `actualAmounts` sparse map instead of upgrading the `statusOverrides` value shape (TD-01, Option B)
- **Rejected** — requires two sparse maps per source to stay in sync (clearing status back to pending can leave a stale actual amount), versus one map with a straightforward legacy-string fallback that mirrors a pattern already proven in this codebase.

### Alternative B: Transient, unpersisted actual amount (TD-01, Option C)
- **Rejected** — contradicts the capability's explicit "persists per entry" requirement, and does not actually mirror `InvestmentTimeline.vue`'s behavior, since Timeline's `actualValue` **is** persisted via `saveState()`.

### Alternative C: Merge/aggregate income and expense projections inline inside `CashFlowOverview.vue` (TD-02, Option B)
- **Rejected** — puts business logic in a Vue component, breaking the separation-of-concerns rule this codebase follows in every prior tracker phase (`CLAUDE.md` §Core Directives).

### Alternative D: Read-only Cash Flow Overview (TD-03, Option A)
- **Rejected by user decision** — the research recommendation favored a read-only screen (zero duplicated interactive/persistence logic, and the capability bullet reads as a presentation surface), but the user chose a fully interactive overview to avoid tab-switching when correcting an entry, accepting the added duplication as a trade-off.

---

## Consequences

### Positive
- Income, Expense, and Timeline entries now share one consistent "mark Done → edit actual value" interaction pattern across the whole app.
- The new Cash Flow Overview gives a single screen to review and correct the month's full picture (income + expenses) without switching tabs.
- Aggregation logic stays in a pure, unit-testable service module (`cashFlowCalculations.js`), consistent with every other tracker's architecture.

### Negative
- Every read site of `statusOverrides` (both trackers, plus the new overview) must handle both the legacy string shape and the new `{status, actualAmount}` object shape indefinitely, unless a future one-time migration sweep is introduced.
- The status-toggle and actual-amount edit controls now exist in three components (`IncomeTracker.vue`, `ExpenseTracker.vue`, `CashFlowOverview.vue`) instead of two; a future UX change to that control must be applied in three places to stay consistent. This is an accepted trade-off (user decision) favoring convenience over minimizing duplicated surface area.

---

## References
- [ADR-004 — Expense Tracker Persistence & Projection Layer — Reuse of Income Tracker Pattern](ADR-004-expense-tracker-pattern-reuse.md)
- [ADR-006 — Income/Expense Source Edit & Delete — Reuse of Loan Tracker Interaction Pattern](ADR-006-tracker-source-edit-delete.md)
- [`src/components/InvestmentTimeline.vue`](../../src/components/InvestmentTimeline.vue#L122-L147)
- [`src/App.vue`](../../src/App.vue#L130-L132)
- [Technical Decisions — Editable Actual Amounts & Consolidated Cash Flow Overview](../decisions/technical-decisions-cash-flow-overview.md)
