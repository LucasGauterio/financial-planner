# ADR-010: Recurring Income End Date — Reuse of Expense Tracker's `endMonth` Pattern

- **Status**: Accepted
- **Date**: 2026-09-15
- **Deciders**: Core Engineering Team
- **Related decisions**: [ADR-005](ADR-005-expense-recurring-end-date.md) (Recurring Expense End Date — original decision), [`technical-decisions-expense-recurring-end-date.md`, TD-01](../decisions/technical-decisions-expense-recurring-end-date.md)

---

## Context and Problem Statement

Phase 8 added an optional `endMonth` (`'YYYY-MM'`, nullable, inclusive) to recurring expense sources, per [`technical-decisions-expense-recurring-end-date.md`, TD-01](../decisions/technical-decisions-expense-recurring-end-date.md): `generateExpenseProjection`'s loop stops emitting entries once the computed month exceeds `endMonth`, so a bounded-term expense (a financed purchase, a fixed-term subscription) stops projecting instead of recurring indefinitely. At the time, that TD's own Trigger explicitly scoped the capability to expenses only, noting the income tracker's inherited model ([`technical-decisions-monthly-income-tracker.md`, TD-02](../decisions/technical-decisions-monthly-income-tracker.md)) "does not provide and was not asked to provide" an end concept.

The user has now asked for the same capability on the income side (e.g., a fixed-term consulting contract, a temporary second job, a lease-subsidy that ends on a known date). This is not a new architectural choice — `endMonth`'s representation, validation, and loop semantics were already fully decided and shipped for expenses; this ADR records applying that exact same, already-proven pattern to income sources, symmetric with how [ADR-004](ADR-004-expense-tracker-pattern-reuse.md) originally had Expense reuse Income's projection-engine pattern (now the reuse direction runs the other way for this one field).

No new technical-decisions document was produced: Option A of `technical-decisions-expense-recurring-end-date.md` TD-01 is reused verbatim, not re-decided.

---

## Decision

1. **Income sources gain the identical `endMonth` field** (nullable `'YYYY-MM'` string, inclusive) as expense sources. [`generateIncomeProjection`](../../src/services/incomeCalculations.js) gains the same bound check `generateExpenseProjection` already has: once the computed month exceeds `endMonth`, the loop stops emitting entries for that source, in addition to the existing `horizonMonths` bound (whichever is reached first) — and, per [BUGFIX-001](../TRACKER.md#bug-fix-traceability), in addition to the catch-up extension that guarantees the current month is always reachable.
2. **`IncomeTracker.vue`'s form** gains the identical optional "End Month" `<input type="month">`, shown only when `recurring` is checked, validated `endMonth >= startMonth`, mirroring [`ExpenseTracker.vue`'s form field](../../src/components/ExpenseTracker.vue) exactly.
3. **Status-override reset on parameter edit** (already-decided [`tracker-source-edit-delete/TD-02`](../decisions/technical-decisions-tracker-source-edit-delete.md), Option B) is extended to include `endMonth` in its change-detection, matching `ExpenseTracker.vue`'s existing `isParamsChanged` check exactly — editing a source's `endMonth` (in addition to `startMonth`/`recurring`) now also clears its `statusOverrides`, gated by the existing `ConfirmDialog`.
4. **Source card footer badge** mirrors `ExpenseTracker.vue`'s: a recurring source with an `endMonth` shows "Recurring → {endMonth}" instead of just "Recurring".

---

## Considered Alternatives

Per the reused TD's own analysis (see [`technical-decisions-expense-recurring-end-date.md`](../decisions/technical-decisions-expense-recurring-end-date.md)), Option B (installment-count) and Option C (recurrence-type enum) were already rejected for expenses and are not re-litigated here — applying a different representation to income than to expense would introduce an asymmetry between the two trackers for no benefit, undermining the whole point of `endMonth` being a shared, consistent capability across both source-tracking screens.

---

## Consequences

### Positive
- Income and Expense trackers are now fully symmetric in their source data model (both: `id, name, amount, type, startMonth, recurring, endMonth?, statusOverrides`) — a user who knows how to bound a recurring expense already knows how to bound a recurring income source.
- Zero new decisions to make; the field, validation, loop bound, and UI shape are all already proven in production by the expense side.

### Negative
- None beyond what ADR-005 already accepted for expenses (a small additional form-validation rule, `endMonth >= startMonth`).

---

## References
- [ADR-005 — Recurring Expense End Date — Bounded Divergence from the Income Tracker Pattern](ADR-005-expense-recurring-end-date.md)
- [`technical-decisions-expense-recurring-end-date.md`, TD-01](../decisions/technical-decisions-expense-recurring-end-date.md)
- [`src/services/expenseCalculations.js`](../../src/services/expenseCalculations.js)
- [`src/components/ExpenseTracker.vue`](../../src/components/ExpenseTracker.vue)
