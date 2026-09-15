# ADR-011: Bounded Sources Always Project Their Full Start-to-End Span

- **Status**: Accepted
- **Date**: 2026-09-15
- **Deciders**: Core Engineering Team
- **Related decisions**: [ADR-005](ADR-005-expense-recurring-end-date.md) (Recurring Expense End Date — original `endMonth` decision), [ADR-010](ADR-010-income-recurring-end-date.md) (Recurring Income End Date), [`technical-decisions-expense-recurring-end-date.md`, TD-01](../decisions/technical-decisions-expense-recurring-end-date.md)

---

## Context and Problem Statement

`generateIncomeProjection`/`generateExpenseProjection` compute how many months to generate for a recurring source as `horizonMonths + monthsSinceStart` (per the current-month catch-up fix), then separately stop early if the source has an `endMonth` and the loop reaches it. For a **bounded** source (one with `endMonth` set) whose total lifespan is longer than the user's currently-selected horizon, this meant the projection was truncated at `horizonMonths` months from today — well before reaching the source's own `endMonth` — even though the source's complete lifespan is fully known and finite. A user registering, say, a 3-year fixed-term contract (`startMonth: 2026-01`, `endMonth: 2028-12`) with the default 1-year horizon selected would only ever see the first 12 months of that contract; the remaining 24 months (still within the contract's own defined lifetime) were invisible regardless of how far the source's own end date actually was, unless the user manually cranked the horizon slider up.

The user reported this directly: projections should span "from start to finish date" for a bounded source, "not project 35 years, only to the end of the max end date" — i.e., a source's own `endMonth` should be the actual bound of what's shown, not an additional ceiling layered under the horizon slider's separate ceiling.

---

## Decision

1. **A recurring source with `endMonth` set ignores `horizonMonths` entirely** and always projects every month from `startMonth` through `endMonth` inclusive, regardless of the user's horizon slider selection. The current-month catch-up extension (`monthsSinceStart`) does not apply to bounded sources either — their span is fixed and fully determined by their own two dates, independent of "today."
2. **A recurring source with no `endMonth` is unaffected** — it keeps the existing catch-up-plus-horizon behavior (`horizonMonths + monthsSinceStart` months from `startMonth`, per the earlier current-month bug fix), since an indefinite source has no natural bound of its own and genuinely needs the horizon slider to decide how far forward to look.
3. **The horizon slider's role is unchanged in the UI** — it remains visible and continues to drive unbounded sources' forward window and the stats dashboard aggregation. Per the user's own framing, it now applies *only* where there is no better bound available (no `endMonth`); a bounded source's own dates always take precedence.
4. **Non-recurring (one-off) sources are unaffected** — they already produce exactly one entry regardless of horizon or `endMonth`.

---

## Considered Alternatives

### Alternative A: Keep truncating bounded sources at the horizon, but auto-raise the horizon slider to cover the furthest `endMonth` among registered sources
- **Rejected** — this would make the "selected" horizon value lie (the slider would show one thing, e.g. "1 year", while actually projecting further), and it would globally affect every source's window (including indefinite ones) based on one bounded source's end date, an unrelated coupling the user did not ask for.

### Alternative B: Remove the horizon slider entirely; always derive the shown range purely from source dates
- **Rejected by user decision** (see clarifying question asked before this change) — the horizon slider is kept for sources with no natural end date, since those still need *some* mechanism to decide how far forward to project; only bounded sources are exempted from it.

---

## Consequences

### Positive
- A bounded source's card/drawer now always shows its true, complete lifecycle — matching the user's mental model of "I set a start and end date, show me everything in between."
- No change to indefinite sources' behavior or to the horizon slider's meaning for them.

### Negative
- A very long-lived bounded source (e.g., a 20-year mortgage) will now always render its full month list in the drawer regardless of horizon, which is more DOM to render than before for that specific source — accepted, since correctness (showing the source's real, finite lifetime) takes priority over this minor rendering cost, and it mirrors how the app already accepts up to 420 rows for a 35-year indefinite projection today.

---

## References
- [ADR-005 — Recurring Expense End Date — Bounded Divergence from the Income Tracker Pattern](ADR-005-expense-recurring-end-date.md)
- [ADR-010 — Recurring Income End Date — Reuse of Expense Tracker's `endMonth` Pattern](ADR-010-income-recurring-end-date.md)
- [`src/services/incomeCalculations.js`](../../src/services/incomeCalculations.js)
- [`src/services/expenseCalculations.js`](../../src/services/expenseCalculations.js)
