# ADR-013: Cash Flow Overview Horizon Adopts the Same Ruler Slider as Portfolio/Income/Expense

- **Status**: Accepted
- **Date**: 2026-09-15
- **Deciders**: Core Engineering Team
- **Related decisions**: [ADR-008](ADR-008-income-expense-card-restyle.md) (Cash Flow Overview explicitly out of scope for the card/drawer restyle), [ADR-009](ADR-009-horizon-ruler-slider.md) (Income/Expense Horizon Ruler Slider — original), [ADR-012](ADR-012-month-granularity-horizon-slider.md) (Horizon Slider Steps Month by Month)

---

## Context and Problem Statement

`CashFlowOverview.vue` (Phase 9) was the one tracker left with the original horizon `<select>` dropdown (four fixed options: 1/5/10/35 years) — [ADR-008](ADR-008-income-expense-card-restyle.md) explicitly kept it out of scope when `IncomeTracker.vue`/`ExpenseTracker.vue` were restyled with the card/drawer pattern, and it was likewise untouched when those two later gained the ruler slider ([ADR-009](ADR-009-horizon-ruler-slider.md)) and its month-granularity conversion ([ADR-012](ADR-012-month-granularity-horizon-slider.md)). The user explicitly asked for Cash Flow Overview's horizon control to match the same ruler slider now used everywhere else.

No new technical decision is needed: the slider's markup, styling, and month-granularity behavior are already fully specified and shipped identically in three sibling components (`PortfolioTracker.vue`'s original, and `IncomeTracker.vue`/`ExpenseTracker.vue`'s month-converted versions). This ADR records applying that same, already-proven widget to the fourth.

---

## Decision

1. **`CashFlowOverview.vue`'s horizon `<select>` is replaced by the identical ruler slider** used in `IncomeTracker.vue`/`ExpenseTracker.vue` — same markup (`.horizon-ruler-container` / `.ruler-wrapper` / `input[type="range"].ruler-slider` / `.ruler-ticks` / pill badge), same CSS, same month granularity (`min="1" max="420" step="1"`, default `3` months), not Portfolio's older year-based version — since Cash Flow Overview's data (merged Income/Expense projections) is the same monthly domain as those two trackers, not Portfolio's yearly compound-interest projections.
2. **`horizonMonths.value` is passed directly to `buildCashFlowEntries`**, with no `* 12` conversion, mirroring the fix already applied to `generateIncomeProjection`/`generateExpenseProjection`'s callers.
3. **No other behavior changes**: the merged entry list, per-month totals (including the `net` fix from the prior bug fix), and all interactive controls are unaffected — only the horizon input widget and its default value change.

---

## Considered Alternatives

### Alternative A: Match Portfolio's year-based slider instead
- **Rejected** — Cash Flow Overview shares its data model and interaction pattern with Income/Expense (monthly sources, monthly status tracking), not with Portfolio (yearly compound-interest projections); matching the year-based slider would reintroduce the same month/year granularity mismatch Income/Expense already fixed in ADR-012.

---

## Consequences

### Positive
- All four trackers with a horizon control (Portfolio excepted only in unit, not widget) now share one consistent interaction pattern; Cash Flow Overview specifically matches Income/Expense's granularity, which is the more relevant sibling given its shared monthly data.

### Negative
- None beyond what ADR-009/ADR-012 already accepted for the other two trackers.

---

## References
- [ADR-008 — Income/Expense Tracker Card & Drawer Restyle (Cash Flow Overview explicitly out of scope)](ADR-008-income-expense-card-restyle.md)
- [ADR-009 — Income/Expense Projection Horizon — Reuse of Portfolio Tracker's Ruler Slider](ADR-009-horizon-ruler-slider.md)
- [ADR-012 — Income/Expense Horizon Slider Steps Month by Month, Defaults to Near-Term](ADR-012-month-granularity-horizon-slider.md)
- [`src/components/CashFlowOverview.vue`](../../src/components/CashFlowOverview.vue)
