# ADR-015: Projection Horizon Defaults to the Current Month Only

- **Status**: Accepted
- **Date**: 2026-09-15
- **Deciders**: Core Engineering Team
- **Related decisions**: [ADR-012](ADR-012-month-granularity-horizon-slider.md) (Horizon Slider Steps Month by Month, Defaults to Near-Term), [ADR-014](ADR-014-stats-dashboard-horizon-window-scoping.md) (Stats Dashboard Scoped to the Selected Horizon Window)

---

## Context and Problem Statement

[ADR-012](ADR-012-month-granularity-horizon-slider.md) moved the horizon ruler from year-steps to month-steps and lowered the default from `12` to `3` months, on the reasoning that a near-term rolling window is more useful than a year-out projection. The user's follow-up request narrows this further: on first opening Income, Expenses, or Cash Flow Overview, the screen should show **just the current month** — not a 3-month rolling window — with the ruler itself still available to widen the view on demand.

This is a direct continuation of the same "near-term by default" reasoning behind ADR-012, and compounds with [ADR-014](ADR-014-stats-dashboard-horizon-window-scoping.md): now that the stats dashboard is correctly scoped to `[currentMonth, currentMonth + horizonMonths - 1]`, a default of `3` still shows two months of *future, unconfirmed* projection in the stats alongside the current month, which is more than the user wants to see by default.

---

## Decision

**The default `horizonMonths` ref is lowered from `3` to `1` in all three screens** — `IncomeTracker.vue`, `ExpenseTracker.vue`, and `CashFlowOverview.vue` — so each opens showing only the current month. With ADR-014's windowing in place, this means the stats dashboard and the Cash Flow Overview's default view both start scoped to exactly the current month. The ruler's range (`1`-`420`, step `1`) and all other slider behavior are unchanged; the user can still drag it out to see future months.

---

## Considered Alternatives

### Alternative A: Keep the `3`-month default, only change Cash Flow Overview
- **Rejected** — the user's request applies to "the projection" generically, and all three screens share the identical ruler component and semantics per ADR-013; treating them inconsistently would reintroduce the visual/behavioral mismatch ADR-009/ADR-013 were written to eliminate.

### Alternative B: Change the ruler's `min` from `1` to something else
- **Rejected** — out of scope. The user asked for the *default selection*, not the slider's minimum bound; `min="1"` (already the floor) is untouched.

---

## Consequences

### Positive
- Opening any of the three screens shows exactly "this month," matching the user's stated mental model.
- Combined with ADR-014, the stats dashboard's first-paint figures are the smallest, least-ambiguous set possible (only the current month's entries).

### Negative
- Users who relied on seeing a few months ahead by default must now drag the ruler each session; this is an accepted trade-off since the ruler position is not currently persisted (no existing requirement to do so).

---

## References
- [ADR-012 — Income/Expense Horizon Slider Steps Month by Month, Defaults to Near-Term](ADR-012-month-granularity-horizon-slider.md)
- [ADR-014 — Stats Dashboard Scoped to the Selected Horizon Window](ADR-014-stats-dashboard-horizon-window-scoping.md)
- [`src/components/IncomeTracker.vue`](../../src/components/IncomeTracker.vue)
- [`src/components/ExpenseTracker.vue`](../../src/components/ExpenseTracker.vue)
- [`src/components/CashFlowOverview.vue`](../../src/components/CashFlowOverview.vue)
