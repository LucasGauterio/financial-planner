# ADR-012: Income/Expense Horizon Slider Steps Month by Month, Defaults to Near-Term

- **Status**: Accepted
- **Date**: 2026-09-15
- **Deciders**: Core Engineering Team
- **Related decisions**: [ADR-009](ADR-009-horizon-ruler-slider.md) (Income/Expense Horizon Ruler Slider — original year-stepped slider), [ADR-011](ADR-011-bounded-source-full-span-projection.md) (Bounded Sources Always Project Their Full Start-to-End Span)

---

## Context and Problem Statement

[ADR-009](ADR-009-horizon-ruler-slider.md) replaced the horizon `<select>` with a ruler slider, but kept the underlying unit as **years** (`min="1" max="35" step="1"`, bound to `horizonYears`, multiplied by 12 before being passed to `generateIncomeProjection`/`generateExpenseProjection`). Every drag of the slider jumped a full 12 months at once, and the default (`horizonYears: 1`) always opened a source's drawer showing a full year (12 months) ahead — even though Income and Expense sources are tracked and edited at monthly granularity everywhere else in the app (status toggles, actual amounts, `startMonth`/`endMonth` are all `'YYYY-MM'`).

The user reported this directly: the slider should "increase values in the project[ion] month by month," and the default view should show "this month['s] income or expenses[,] the projections for next months, not years."

---

## Decision

1. **The slider steps in months, not years**: `horizonYears` (years, `1`-`35`) is replaced with `horizonMonths` (months, `1`-`420`, `step="1"`), passed directly to `generateIncomeProjection`/`generateExpenseProjection` with no `* 12` conversion. The total reachable range is unchanged (420 months = 35 years, matching the ceiling `monthly-income-tracker/TD-03` already established) — only the step size shrinks from 12 months to 1 month, so every drag position is reachable, not just whole-year jumps.
2. **Default value changes from 12 months (1 year) to 3 months**: opening a tracker now shows a near-term view (this month plus the next two) by default, instead of a full year ahead. Per [ADR-011](ADR-011-bounded-source-full-span-projection.md), this default only affects **unbounded** sources (no `endMonth`) — a bounded source already always shows its full span regardless of the slider.
3. **The horizon badge and tick labels are recomputed for month granularity**: the pill badge now shows `"{N} Month(s) / {Mon YYYY}"` (e.g., "3 Month(s) / Nov 2026") instead of `"{N} Year(s) / {YYYY}"`, computed from the current month/year plus the selected `horizonMonths`. Tick marks stay at 8 evenly-spaced points across the range (every 60 months / 5 years, `[0, 60, 120, ..., 420]`) — denser month-level ticks would be unreadable at this scale; the slider itself still moves 1 month per step between ticks.

---

## Considered Alternatives

### Alternative A: Keep year-based stepping, only lower the default
- **Rejected** — this would address the default-view complaint but not the stated core request ("increase values... month by month"); a user wanting to see, say, 4 months ahead specifically would still have to jump to a full extra year.

### Alternative B: Cap the slider's max range down to something small (e.g. 24 months) now that it steps by month
- **Rejected** — nothing about month-level stepping requires shrinking the reachable range; a user who wants a long-term month-by-month view (e.g. 18 months) should still be able to reach it, and the existing 35-year ceiling was already an established, decided capability (`monthly-income-tracker/TD-03`) not being revisited here.

---

## Consequences

### Positive
- The horizon control's granularity now matches the app's actual monthly data model everywhere else.
- The default view is immediately useful for "what do I have coming up soon" without the user needing to touch the slider at all.

### Negative
- None beyond what ADR-009 already accepted (a slider spanning many discrete positions); the step size shrinking to 1 month makes fine-grained dragging require more precision than year-jumps did, which is an inherent trade-off of finer granularity, not a regression.

---

## References
- [ADR-009 — Income/Expense Projection Horizon — Reuse of Portfolio Tracker's Ruler Slider](ADR-009-horizon-ruler-slider.md)
- [ADR-011 — Bounded Sources Always Project Their Full Start-to-End Span](ADR-011-bounded-source-full-span-projection.md)
- [`src/components/IncomeTracker.vue`](../../src/components/IncomeTracker.vue)
- [`src/components/ExpenseTracker.vue`](../../src/components/ExpenseTracker.vue)
