# ADR-009: Income/Expense Projection Horizon — Reuse of Portfolio Tracker's Ruler Slider

- **Status**: Accepted
- **Date**: 2026-09-15
- **Deciders**: Core Engineering Team
- **Related decisions**: ADR-008 (Income/Expense Tracker Card & Drawer Restyle — Reuse of Loan Tracker Visual Pattern), [`monthly-income-tracker/TD-03`](../decisions/technical-decisions-monthly-income-tracker.md) (Long-Horizon Projection Rendering Strategy — user-selectable horizon)

---

## Context and Problem Statement

`IncomeTracker.vue` and `ExpenseTracker.vue` select the projection horizon via a plain `<select>` dropdown with four fixed options (1/5/10/35 years), per [`monthly-income-tracker/TD-03`](../decisions/technical-decisions-monthly-income-tracker.md)'s decided option ("user-selectable horizon... e.g. 1/5/10/35 years"). `PortfolioTracker.vue` already solved the same "pick a projection horizon" problem with a different, more visually developed control: a `input[type="range"]` ruler slider (`.ruler-slider`, min 1, max 50, step 1) inside a `.horizon-ruler-container`, with tick marks at 10-year intervals (`.ruler-ticks`) and a pill badge showing the selected year count and the resulting calendar year ([`PortfolioTracker.vue#L7-L32`](../../src/components/PortfolioTracker.vue#L7-L32)). Per [`ui-pattern-consistency.md`](../../.claude/rules/ui-pattern-consistency.md), a sibling screen's existing conventions should be reused rather than continuing to diverge — this ADR records switching Income/Expense's horizon control to match Portfolio's slider, continuing the visual-consistency effort started in [ADR-008](ADR-008-income-expense-card-restyle.md).

No new technical-decisions document was produced: the target control is a fully specified, already-shipped sibling pattern, not a new architectural choice with alternatives.

---

## Decision

1. **Ruler slider replaces the `<select>` dropdown** in both `IncomeTracker.vue` and `ExpenseTracker.vue`, reusing `PortfolioTracker.vue`'s exact markup/CSS shape (`.horizon-ruler-container`, `.ruler-wrapper`, `input[type="range"].ruler-slider`, `.ruler-ticks`, and the pill badge showing `{horizonYears} year(s) / {currentYear + horizonYears}`).
2. **Range is `min="1" max="35" step="1"`** (not Portfolio's `max="50"`) — Income/Expense's horizon has always capped at 35 years per `monthly-income-tracker/TD-03`'s decided option set; the slider's range preserves that existing ceiling rather than adopting Portfolio's unrelated 50-year cap.
3. **Tick marks at 5-year intervals** (`0, 5, 10, 15, 20, 25, 30, 35`), denser than Portfolio's 10-year ticks (`0, 10, 20, 30, 40, 50`) since the total range is shorter — this keeps roughly the same number of visible ticks (7-8) as Portfolio's own ruler.
4. **Default value and semantics are unchanged** — `horizonYears` still defaults to `1` and still drives `generateIncomeProjection`/`generateExpenseProjection`'s `horizonMonths` argument exactly as before; only the input widget changes, not the underlying value or its default.
5. **Continuous selection, not just the prior four discrete stops** — the decided option in `monthly-income-tracker/TD-03` names 1/5/10/35 as examples ("e.g."), not an exhaustive set; a slider naturally offers every integer year in between, which is a superset of the previously reachable values, not a narrowing.

---

## Considered Alternatives

### Alternative A: Keep the `<select>` dropdown, only restyle its visual chrome
- **Rejected** — this would not actually match Portfolio's established pattern (a slider), just reskin a fundamentally different control; the whole point of the request is visual and interaction parity with the sibling screen.

### Alternative B: Slider capped at 50 years, matching Portfolio's range exactly
- **Rejected** — Income/Expense's horizon has never exceeded 35 years (per the decided `monthly-income-tracker/TD-03` option set); extending it to 50 would silently widen a previously-decided capability boundary with no request behind it.

---

## Consequences

### Positive
- The three source-heavy trackers that project into the future (Portfolio, Income, Expense) now share the same horizon-selection interaction, in addition to Income/Expense already sharing Loan's card/drawer pattern (ADR-008).
- A continuous slider lets a user land on any year count from 1 to 35, not just the four previously reachable stops.

### Negative
- A `<select>` is easier to operate via keyboard-only/assistive navigation (arrow keys cycle a small fixed list) than a range slider spanning 35 discrete steps; this trade-off already exists for `PortfolioTracker.vue`'s own slider today and is accepted here for consistency rather than re-litigated.

---

## References
- [ADR-008 — Income/Expense Tracker Card & Drawer Restyle — Reuse of Loan Tracker Visual Pattern](ADR-008-income-expense-card-restyle.md)
- [`monthly-income-tracker/TD-03` — Long-Horizon Projection Rendering Strategy](../decisions/technical-decisions-monthly-income-tracker.md)
- [`src/components/PortfolioTracker.vue`](../../src/components/PortfolioTracker.vue#L1-L40)
- [`.claude/rules/ui-pattern-consistency.md`](../../.claude/rules/ui-pattern-consistency.md)
