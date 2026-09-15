# ADR-014: Stats Dashboard Scoped to the Selected Horizon Window

- **Status**: Accepted
- **Date**: 2026-09-15
- **Deciders**: Core Engineering Team
- **Related decisions**: [BUGFIX-001](../TRACKER.md#bug-fix-traceability) (current-month catch-up extension), [ADR-011](ADR-011-bounded-source-full-span-projection.md) (Bounded Sources Always Project Their Full Start-to-End Span), [ADR-012](ADR-012-month-granularity-horizon-slider.md) (Horizon Slider Steps Month by Month)

---

## Context and Problem Statement

`IncomeTracker.vue`/`ExpenseTracker.vue`'s stats dashboard (§4.6, per ADR-008) computes `stats = calculateMonthlyTotals(projectionEntries.value)` — summing every entry `generateIncomeProjection`/`generateExpenseProjection` return for the current sources, with no month-range filter. Two earlier, independently-correct fixes both widen what those functions return beyond the literal selected horizon:

- **BUGFIX-001** (current-month catch-up): an unbounded recurring source registered before today returns entries starting at its own `startMonth`, not at the horizon window's start — so backlog months between `startMonth` and today are always included, regardless of the selected horizon.
- **ADR-011** (bounded full-span projection): a source with `endMonth` set returns its *entire* `startMonth`-to-`endMonth` span, ignoring `horizonMonths` entirely.

Both are correct and intentional **for the drawer** (per-source projection view) — a user needs to see and confirm old backlog months, and a bounded source's complete lifecycle, regardless of how the ruler happens to be positioned. But the stats dashboard summed the *same* unfiltered entries, so narrowing the ruler down to a short window (e.g., dragging it to `1` for "just this month") did not actually narrow what the stats aggregated — old backlog and/or a bounded source's future overflow kept inflating the "Pending" (and potentially "Received"/"Paid") figures well beyond what the selected horizon implied. The user reported this directly: Income was "calculating pending values" that didn't belong to the month the ruler was set to show.

---

## Decision

1. **The stats dashboard now aggregates only entries within `[currentMonth, currentMonth + horizonMonths - 1]`** — the literal window the ruler represents — via a new `statsEntries` computed that filters `projectionEntries` by month string comparison before feeding `calculateMonthlyTotals`.
2. **The drawer is unaffected** — `drawerProjectionGroups` continues to read the unfiltered `projectionEntries` for the selected source, so catch-up backlog and a bounded source's full span remain fully visible and actionable there, per BUGFIX-001 and ADR-011.
3. **Applied identically to both `IncomeTracker.vue` and `ExpenseTracker.vue`** — same `statsWindowStart`/`statsWindowEnd`/`statsEntries` computed chain in both.

`CashFlowOverview.vue` needed no change: it has no single aggregate "stats" bucket — its per-month totals are already computed per rendered month group (`calculateCombinedMonthlyTotals(entries)` inside the month-grouping loop), each inherently scoped to that one month.

---

## Considered Alternatives

### Alternative A: Stop catch-up/bounded-span entries from being generated at all when the horizon is small
- **Rejected** — this would undo BUGFIX-001 and ADR-011, both explicit, already-validated fixes for the drawer. The stats dashboard's scope and the drawer's scope are legitimately different concerns; conflating them by shrinking the underlying data was the actual bug, not a reason to remove the underlying data.

### Alternative B: Keep the stats dashboard unscoped, but relabel it as "all pending/received" rather than horizon-scoped
- **Rejected** — this doesn't match the user's mental model (the stats sit directly under the horizon ruler and are visually presented as summarizing "the selected view"); it would also still show confusing, ever-growing numbers for old sources regardless of the ruler position, which was the actual complaint.

---

## Consequences

### Positive
- The stats dashboard now genuinely reflects "what does the selected window look like," matching the ruler's own displayed month range.
- The drawer's catch-up/bounded-span behavior (BUGFIX-001, ADR-011) is fully preserved — no old backlog or bounded future becomes inaccessible.

### Negative
- A user with old unconfirmed backlog (e.g., 6 months of never-toggled income) will no longer see that backlog reflected in the stats dashboard's "Pending" figure unless they widen the horizon to include those months — they must open the drawer to find and confirm it. This is the correct trade-off: the stats dashboard is a window-scoped summary, not a backlog alert; a dedicated backlog indicator (if ever needed) would be a separate, explicit capability.

---

## References
- [ADR-011 — Bounded Sources Always Project Their Full Start-to-End Span](ADR-011-bounded-source-full-span-projection.md)
- [ADR-012 — Income/Expense Horizon Slider Steps Month by Month, Defaults to Near-Term](ADR-012-month-granularity-horizon-slider.md)
- [`src/components/IncomeTracker.vue`](../../src/components/IncomeTracker.vue)
- [`src/components/ExpenseTracker.vue`](../../src/components/ExpenseTracker.vue)
