# ADR-005: Recurring Expense End Date — Bounded Divergence from the Income Tracker Pattern

- **Status**: Accepted
- **Date**: 2026-09-14
- **Deciders**: Core Engineering Team
- **Related decisions**: ADR-004 (Expense Tracker Persistence & Projection Layer — Reuse of Income Tracker Pattern), [Technical Decisions — Recurring Expense End Date](../decisions/technical-decisions-expense-recurring-end-date.md)

---

## Context and Problem Statement

ADR-004 established that Phase 8's expense tracker reuses the income tracker's projection data model unchanged (TD-01..TD-04 of [technical-decisions-monthly-income-tracker.md](../decisions/technical-decisions-monthly-income-tracker.md)), including TD-02's boolean `recurring` flag with no concept of an end date — a recurring source projects across the full requested horizon indefinitely. A new requirement — recurring expense sources (e.g., a financed purchase or a fixed-term contract) need an optional end date, so the projection stops generating entries past that month — was raised **for expenses only**, not for income. The question is whether to extend the shared projection engine, fork a separate one for expenses, or reopen the income tracker's TD-02.

---

## Decision

The expense projection engine gains one bounded divergence from the income tracker's model; every other inherited pattern from ADR-004 is unaffected:

1. **Scope of the change is expense-only.** [`generateExpenseProjection`](../../src/services/expenseCalculations.js#L15-L54) reads an optional `endMonth` field (nullable `'YYYY-MM'` string) on each expense source. `generateIncomeProjection` ([`src/services/incomeCalculations.js`](../../src/services/incomeCalculations.js#L15-L54)) and `monthly-income-tracker/TD-02` are **not** reopened or modified — income sources have no `endMonth` concept, per the ad-hoc research's explicit trigger (the user did not request this for income).
2. **No new architectural pattern.** The field is a plain optional property on the same source shape, following the same `'YYYY-MM'` string convention already used for `startMonth`; no new storage key, no schema layer, no separate engine. `EXPENSES_KEY`'s encrypted-blob persistence (ADR-004 point 6) is unaffected — the field is just additional data inside the same blob.
3. **Business logic stays in the existing pure module.** The stop condition is one additional bound check inside `generateExpenseProjection`'s existing loop; no new module, preserving ADR-004 point 8 (pure, side-effect-free calculation module per domain).

---

## Considered Alternatives

### Alternative A: Reopen income tracker's TD-02 to add `endMonth` to both trackers
- **Rejected** — the requirement was scoped to expenses only ("Despesas Mensais precisam ter a possibilidade de ter um prazo final"); extending income's model without a stated need would be speculative scope creep, and would force `monthly-income-tracker/TD-02` (already `decided`) into an unrequested Revision.

### Alternative B: Fork a separate, expense-specific projection module instead of extending `expenseCalculations.js`
- **Rejected** — `expenseCalculations.js` already exists specifically for this domain (per ADR-004); the change is one additional field and one additional loop bound, not a different projection strategy — forking would duplicate the entire module for a single extra check.

### Alternative C: Represent the end as an installment count (`occurrencesLimit`), reusing the loan tracker's pattern
- **Rejected** — per [technical-decisions-expense-recurring-end-date.md TD-01](../decisions/technical-decisions-expense-recurring-end-date.md), the user asked for a calendar end date, not a count; a count drifts out of sync if `startMonth` is edited later and requires the user to compute remaining months themselves.

---

## Consequences

### Positive
- The income tracker's already-decided, already-shipped model (TD-01..TD-04) stays untouched — zero regression risk to Phase 7.
- The divergence is minimal and localized: one nullable field, one loop bound check, one form field in `ExpenseTracker.vue`.
- Every existing recurring expense source (no `endMonth` set) keeps its current behavior — fully backward-compatible with the already-shipped Phase 8.

### Negative
- Income and expense trackers now have a small, intentional asymmetry (expenses support a bounded recurrence, income does not) — a future contributor reading both modules side-by-side must know this is deliberate (documented here) rather than an oversight.
- If a future phase requests the same end-date capability for income, it will need its own TD in `monthly-income-tracker` (or a superseding decision) rather than inheriting this one — `endMonth` was decided in an expense-scoped ad-hoc document, not a transversal one.

---

## References
- [ADR-004 — Expense Tracker Persistence & Projection Layer — Reuse of Income Tracker Pattern](ADR-004-expense-tracker-pattern-reuse.md)
- [`src/services/expenseCalculations.js`](../../src/services/expenseCalculations.js#L15-L54)
- [`src/services/incomeCalculations.js`](../../src/services/incomeCalculations.js#L15-L54)
- [Technical Decisions — Recurring Expense End Date](../decisions/technical-decisions-expense-recurring-end-date.md)
- [Technical Decisions — Monthly Income Registration & Projections](../decisions/technical-decisions-monthly-income-tracker.md)
