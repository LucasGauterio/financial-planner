# Phase 10: Income/Expense Tracker Card & Drawer Restyle

## Objective
Restyle `IncomeTracker.vue` and `ExpenseTracker.vue` to match `LoanTracker.vue`'s visual pattern — a stats dashboard row, registered sources as a card grid with hover-revealed edit/delete actions, and a per-source detail drawer (opened by clicking a card) showing that source's own month-by-month projection — replacing the single combined projection list previously rendered inline below the source list. `CashFlowOverview.vue` is unaffected.

## Technical Decisions
No technical-decisions document was produced for this phase — the target pattern is a fully specified, already-shipped sibling component (`LoanTracker.vue`), not a new architectural choice with alternatives. Per [ADR-008](../../adrs/ADR-008-income-expense-card-restyle.md):

- **Per-source detail drawer** (user decision): each source's projection moves into a `Teleport` slide-in drawer opened by clicking its card, mirroring [`LoanTracker.vue#L296-L440`](../../../src/components/LoanTracker.vue#L296-L440). The single combined list is removed.
- **Stats dashboard row** (user decision): mirrors [`LoanTracker.vue`'s `stats` computed](../../../src/components/LoanTracker.vue#L547-L572) — Income shows total expected / received / pending across the selected horizon + sources count; Expense shows the same with paid in place of received.
- **Card grid** for registered sources, hover-revealed `.card-actions` (edit/delete), mirroring [`LoanTracker.vue#L79-L149`](../../../src/components/LoanTracker.vue#L79-L149).
- **No filter tabs / lifecycle state** — `LoanTracker.vue`'s active/completed/archived/all filter tabs are not adopted; income/expense sources have no equivalent concept.
- **Cash Flow Overview out of scope** (user decision) — `CashFlowOverview.vue` keeps its current layout unchanged.
- **Add/Edit modal and `ConfirmDialog`s unchanged** — both trackers already share `LoanTracker.vue`'s modal shape and `ConfirmDialog.vue`.

## Dependency Map
- Depends on Phase 06 (`LoanTracker.vue` — the reference pattern), Phase 07/08 (Income/Expense Trackers being restyled), and Phase 09 (`toggleStatus`/`displayActualAmount`/`setActualAmount`, reused unchanged inside the new drawer).
- SI-10.2 depends on SI-10.1 having established the pattern once (mirrored, not reused code — Vue SFCs don't share templates across components).
- SI-10.3 depends on SI-10.1 and SI-10.2 (i18n keys and full-suite regression need both trackers restyled first).

## Step Implementations (SIs)

### SI-10.1: Income Tracker Card Grid, Stats Dashboard & Detail Drawer
- Add a `stats` computed reusing [`calculateMonthlyTotals`](../../../src/services/incomeCalculations.js#L62-L77) over the *entire* `projectionEntries` array (not grouped by month, since the function only sums by status regardless of grouping) to get `{ received, pending, total }`; combine with `sources.value.length` for a sources count. Render as a `.stats-grid` of `.stat-card`s mirroring [`LoanTracker.vue#L16-L53`](../../../src/components/LoanTracker.vue#L16-L53).
- Replace the always-visible `.sources-list` of `.income-entry-row`s ([`IncomeTracker.vue#L31-L47`](../../../src/components/IncomeTracker.vue#L31-L47)) with a card grid (one card per source: name, type, amount, hover-revealed `.card-actions` calling the existing `editSource`/`deleteSource`), mirroring [`LoanTracker.vue#L79-L149`](../../../src/components/LoanTracker.vue#L79-L149). Clicking a card (outside the action icons, guarded with `@click.stop` per [`LoanTracker.vue#L135`](../../../src/components/LoanTracker.vue#L135)) calls a new `openDetailsDrawer(source)`.
- Remove the combined `projectionGroups`-driven list ([`IncomeTracker.vue#L53-L83`](../../../src/components/IncomeTracker.vue#L53-L83)) from the top-level template. Add `selectedSource` + `showDetailsDrawer` refs and a `Teleport`-based slide-in drawer (mirroring [`LoanTracker.vue#L296-L440`](../../../src/components/LoanTracker.vue#L296-L440)) rendering a `drawerProjectionGroups` computed: `projectionEntries.value.filter(e => e.sourceId === selectedSource.value?.id)`, grouped by year/month using the same grouping logic the removed list used. Each entry inside the drawer keeps its existing status-toggle button and actual-amount input (`displayActualAmount`/`setActualAmount`/`toggleStatus`, unchanged per Phase 9).
- The horizon selector stays at the top level (unchanged location) — it now drives both `stats` and whichever drawer is open.
- Target files:
  - `src/components/IncomeTracker.vue` (extensive template/script rework; calculation functions in `incomeCalculations.js` are unchanged)
  - Reference pattern: [`src/components/LoanTracker.vue`](../../../src/components/LoanTracker.vue)
- Tests:
  - `src/components/IncomeTracker.test.js` (rewrite the DOM-shape-dependent assertions: source rows become `.source-card`s; `toggleStatus`/actual-amount tests now open the drawer first via `.source-card` click before finding `.btn-toggle-status`/`.actual-amount-input`, mirroring [`LoanTracker.test.js`'s drawer-click-then-interact pattern](../../../src/components/LoanTracker.test.js#L184-L203)). Cover: stats dashboard renders correct totals; card grid renders one card per source; edit/delete icons work from the card (unchanged behavior, new location); opening a card's drawer shows only that source's entries; closing the drawer.
  - Run: `npx vitest run src/components/IncomeTracker.test.js`

### SI-10.2: Expense Tracker Card Grid, Stats Dashboard & Detail Drawer
- Mirror SI-10.1 function-for-function on `ExpenseTracker.vue`, substituting `paid` for `received` throughout (stats dashboard shows paid instead of received; card grid and drawer are otherwise identical in shape).
- Target files:
  - `src/components/ExpenseTracker.vue` (extensive template/script rework; `expenseCalculations.js` unchanged)
  - Reference pattern: [`src/components/IncomeTracker.vue`](../../../src/components/IncomeTracker.vue) (post-SI-10.1), [`src/components/LoanTracker.vue`](../../../src/components/LoanTracker.vue)
- Tests:
  - `src/components/ExpenseTracker.test.js` (same rewrite shape as SI-10.1, substituting paid/pending).
  - Run: `npx vitest run src/components/ExpenseTracker.test.js`

### SI-10.3: i18n Additions & Full-Suite Regression
- Add any new label keys the stats dashboard/drawer need (e.g. `income.stats.totalExpected`/`sourcesCount` equivalents, reusing existing `income.received`/`income.pending`/`income.total` keys where the label is identical) to both `en-US.js` and `pt-BR.js`. `CashFlowOverview.vue` and its i18n keys are untouched.
- Confirm `CashFlowOverview.vue`'s own tests still pass unmodified (it reads `repository.getIncome()`/`getExpenses()` independently and does not depend on either tracker's internal DOM/computed shape).
- Target files: `src/locales/en-US.js`, `src/locales/pt-BR.js`
- Tests: `npx vitest run` (full suite regression, confirm no breakage in `App.vue` tab switching or `CashFlowOverview.vue`).

### SI-10.4: Horizon Ruler Slider (addendum, 2026-09-15)
- Follow-up user request, documented in [ADR-009](../../adrs/ADR-009-horizon-ruler-slider.md): replace the Projection Horizon `<select>` dropdown in both trackers with a ruler-slider input reusing [`PortfolioTracker.vue`'s existing horizon slider](../../../src/components/PortfolioTracker.vue#L7-L32) (`.horizon-ruler-container` / `.ruler-wrapper` / `input[type="range"].ruler-slider` / `.ruler-ticks` / pill badge), capped at `min="1" max="35"` (not Portfolio's 50) to preserve the trackers' existing horizon ceiling. `horizonYears`'s default and its effect on `generateIncomeProjection`/`generateExpenseProjection` are unchanged. `CashFlowOverview.vue`'s own horizon `<select>` is left untouched (out of scope, per ADR-008).
- Target files:
  - `src/components/IncomeTracker.vue`, `src/components/ExpenseTracker.vue`
  - Reference pattern: [`src/components/PortfolioTracker.vue`](../../../src/components/PortfolioTracker.vue#L1-L40)
- Tests:
  - `src/components/IncomeTracker.test.js` / `src/components/ExpenseTracker.test.js` (extend) — the slider renders with `min="1"`/`max="35"`; changing its value updates `horizonYears` (asserted via the resulting calendar year in the pill badge).
  - Run: `npx vitest run src/components/IncomeTracker.test.js src/components/ExpenseTracker.test.js`

## Deliverables
- `IncomeTracker.vue` and `ExpenseTracker.vue` restyled to `LoanTracker.vue`'s stats-dashboard + card-grid + detail-drawer pattern, with the previous combined projection list removed.
- Existing status-toggle and actual-amount editing behavior (Phase 9) preserved unchanged inside the new per-source drawer.
- `CashFlowOverview.vue` unaffected.
- Updated `IncomeTracker.test.js` / `ExpenseTracker.test.js` covering the new card-grid/drawer DOM shape.
- Projection Horizon control restyled from a `<select>` to a ruler slider matching `PortfolioTracker.vue`, capped at 35 years.
