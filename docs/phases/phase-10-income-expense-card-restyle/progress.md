# phase-10-income-expense-card-restyle — Progress

**Status:** completed
**SIs:** 4/4 completed (SI-10.4 added as an addendum, 2026-09-15)

### SI-10.1 — Income Tracker Card Grid, Stats Dashboard & Detail Drawer
- **Status:** completed
- **Tests:** 15 passing
- **Observations:**
  - Dropped the `<transition name="slide-panel">` wrapper originally planned to mirror `LoanTracker.vue`'s drawer: in jsdom, Vue defers a transition-wrapped element's DOM removal until a real ~350ms timer fires, which a same-test assertion right after closing doesn't wait for. Plain `v-if` (matching Income/Expense's own existing Add/Edit modal, which also has no `<transition>`) removes synchronously and avoids the class of flakiness entirely — a `drawerIn` CSS keyframe animation is kept for the enter visual.
  - Root-caused and fixed a test-pollution bug: several new tests open the drawer (Teleported to `document.body`) and don't close it before the test ends; since `@vue/test-utils` doesn't auto-unmount between tests, that stale DOM leaked into later tests' `DOMWrapper(document.body)` queries. Fixed with a shared `wrapper` + `afterEach(() => wrapper?.unmount())`. Worth carrying into any future test file that opens Teleported content.

### SI-10.2 — Expense Tracker Card Grid, Stats Dashboard & Detail Drawer
- **Status:** completed
- **Tests:** 17 passing
- **Observations:** Mirrored SI-10.1's plain-`v-if` drawer (no `<transition>`) and shared-`wrapper` + `afterEach(unmount)` test pattern from the start; all 17 tests passed on the first run with no pollution issues.

### SI-10.3 — i18n Additions & Full-Suite Regression
- **Status:** completed
- **Tests:** 121 passing (full suite); `npm run build` succeeds
- **Observations:**
  - No new i18n keys were actually needed — every new label in the stats dashboard/drawer/card grid reuses an existing key (`income.total`/`received`/`pending`/`sourcesCount`, `expenses.total`/`paid`/`pending`/`sourcesCount`, `form.recurring`, `form.startMonth`, etc.), already present in both `en-US.js` and `pt-BR.js` from Phases 7-9.
  - `CashFlowOverview.vue` required zero changes and its 6 tests still pass unmodified, confirming it is fully decoupled from IncomeTracker/ExpenseTracker's internal DOM/computed shape (per ADR-008).

### SI-10.4 — Horizon Ruler Slider (addendum, 2026-09-15)
- **Status:** completed
- **Tests:** 123 passing (full suite); `npm run build` succeeds
- **Observations:**
  - Follow-up user request: replace the Projection Horizon `<select>` dropdown with a ruler slider matching `PortfolioTracker.vue`'s existing horizon control. Documented as a lightweight addendum (project-plan.md bullet + [ADR-009](../../adrs/ADR-009-horizon-ruler-slider.md) + RFC §4.9 + FDD §4.7 + PRD FR-013) rather than a new numbered phase, since it's a pure pattern-reuse restyle of a single control continuing Phase 10's own effort, with no new capability or data-model change.
  - Range capped at `min="1" max="35"` (not Portfolio's `max="50"`) to preserve Income/Expense's existing 35-year horizon ceiling; `horizonYears`'s default (`1`) and its effect on projections are unchanged.
  - `CashFlowOverview.vue`'s own horizon `<select>` was deliberately left untouched — it was out of scope in ADR-008 and remains so here.
