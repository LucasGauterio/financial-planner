---
scope_type: ad-hoc
related_phases: [8]
status: decided
date: 2026-09-14
scope_description: "Optional end date for recurring monthly expense sources, so a recurring expense stops projecting after a given month instead of continuing indefinitely across the requested horizon."
---

# Technical Decisions — Recurring Expense End Date

_Subprojects in scope:_

- `src/` — single Vue 3 SPA (no separate backend/frontend split in this project); extends the Phase 8 expense data model (`src/services/expenseCalculations.js`) and the tracker UI (`src/components/ExpenseTracker.vue`).

---

## TD-01: Recurring Expense End Date Representation

**Scope:** Cross-layer

**Trigger:** User requested that recurring monthly expense sources (fixed bills, variable spending, subscriptions) be able to carry an optional end date, so a recurring expense stops generating projected entries past that month instead of recurring indefinitely across the requested horizon — a capability the income tracker's inherited model ([technical-decisions-monthly-income-tracker.md, TD-02](technical-decisions-monthly-income-tracker.md), Decision: Option A — boolean `recurring` flag, monthly only, no end concept) does not provide and was not asked to provide.

**Context:** [`generateExpenseProjection`](../../src/services/expenseCalculations.js#L15-L54) currently expands a `recurring: true` source for the full requested `horizonMonths`, with no stopping condition other than the horizon itself (mirrors [`generateIncomeProjection`](../../src/services/incomeCalculations.js#L15-L54) verbatim, per [ADR-004](../adrs/ADR-004-expense-tracker-pattern-reuse.md)). A financed purchase or a bill with a known term (e.g., a 24-month equipment rental, a fixed-term subscription contract) needs the projection to stop once that term ends, without the user having to manually mark every future month as not-applicable. `startMonth` is already represented as a `'YYYY-MM'` string ([`expenseCalculations.js#L23`](../../src/services/expenseCalculations.js#L23)), which sets the natural representation for a symmetric end boundary.

**Options:**

### Option A: Optional `endMonth` field (nullable `'YYYY-MM'` string, inclusive)
- Add an optional `endMonth` to the expense source shape. When set, `generateExpenseProjection`'s loop stops generating entries once the computed month exceeds `endMonth` (in addition to the existing `horizonMonths` bound — whichever is reached first). When unset/`null` (the default), behavior is unchanged from today (recurs across the full horizon).
- **Pros:** Single nullable field, symmetric in shape with `startMonth` (same `'YYYY-MM'` type, same `<input type="month">` UI control); fully backward-compatible — every existing recurring source with no `endMonth` keeps its current behavior; minimal change to the loop (one extra bound check).
- **Cons:** Needs a small validation rule (`endMonth >= startMonth`) surfaced in the form.

### Option B: `occurrencesLimit` (integer installment count), reusing the loan tracker's pattern
- Reuse [`loanCalculations.js`](../../src/services/loanCalculations.js#L15-L59)'s `installmentsCount` convention: the user specifies how many months the recurring expense repeats for, instead of a calendar end date.
- **Pros:** Reuses an existing precedent in the codebase (credit card installment counting).
- **Cons:** The user explicitly asked for a "prazo final" (an end **date**), not an installment count — a count requires the user to compute how many months remain until a known end date themselves, and drifts out of sync if the source's `startMonth` is edited later; a calendar bound is the more direct match to the stated need and to how bills/contracts are actually described (by end date, not by remaining count).

### Option C: Recurrence-type enum (`indefinite` / `bounded` / `one-off`) with `endMonth` only meaningful under `bounded`
- Replace the boolean `recurring` flag with a three-way enum, adding a distinct "bounded recurring" state alongside a still-present `endMonth` field.
- **Pros:** Makes the three states explicit in the data model.
- **Cons:** A nullable `endMonth` (Option A) already fully encodes "has an end" vs. "does not" without a redundant third field — presence/absence of `endMonth` on an already-recurring source is a simpler, equally explicit signal; the enum only adds a migration/validation burden for no new expressiveness over Option A.

**Recommendation:** Option A — a nullable `endMonth` mirrors `startMonth`'s existing `'YYYY-MM'` shape and UI control, requires the smallest change to `generateExpenseProjection`'s loop (one additional bound check, still O(1) per iteration), and keeps every already-registered recurring expense source behaviorally unchanged (absent field = current behavior). It matches the user's own framing ("prazo final") more directly than an installment count (Option B) and avoids the redundant enum of Option C.

**Decision:** Option A — Optional `endMonth` field (nullable `'YYYY-MM'` string, inclusive).

---

## Decisions Summary

| ID | Scope | Decision | Recommendation | Choice |
|----|-------|----------|---------------|--------|
| TD-01 | Cross-layer | Recurring Expense End Date Representation | Option A — Optional `endMonth` field | Option A |
