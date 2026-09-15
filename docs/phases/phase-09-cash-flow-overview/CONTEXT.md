---
kind: phase
name: phase-09-cash-flow-overview
sources_mtime:
  docs/project-plan.md: "2026-09-14T19:51:39"
  docs/decisions/technical-decisions-cash-flow-overview.md: "2026-09-14T19:57:41"
  docs/adrs/ADR-007-cash-flow-overview.md: "2026-09-14T19:58:06"
  docs/phases/phase-08-monthly-expense-tracker/CONTEXT.md: "2026-09-14T18:57:29"
---

# phase-09-cash-flow-overview — Context

## Scope

**Phase name:** Editable Actual Amounts & Consolidated Cash Flow Overview

**Capabilities** (literal, `docs/project-plan.md`):

- Extend the Income and Expense trackers' projection entries so that, once an entry is marked Received/Paid, an editable "actual amount" field appears for that entry (defaulting to the expected/registered amount), mirroring the Investment Timeline's mark-as-Done editable `actualValue` pattern. The edited amount persists per entry and feeds the monthly totals in place of the expected amount.
- Add a new consolidated Cash Flow Overview screen presenting Income and Expense projections together in a single month-by-month list, showing each entry's Pending/Paid/Received status and actual amount where applicable, plus monthly aggregate totals for Pending, Paid, and Received across both income and expenses.

**Out of scope:** Legacy `statusOverrides` migration sweep — old string-shaped override values coexist indefinitely with the new `{status, actualAmount}` shape via a read-time fallback; a one-time normalization migration is deferred (deferred — see `docs/PRD.md` § Out of Scope / Deferred Items, `docs/RFC.md` § Open Questions / Future Roadmap).
**Deliverables:** Target files: [`src/components/InvestmentTimeline.vue`](../../../src/components/InvestmentTimeline.vue#L1-L260) (reference pattern), `src/components/IncomeTracker.vue`, `src/components/ExpenseTracker.vue`, `src/services/incomeCalculations.js`, `src/services/expenseCalculations.js`, `src/components/CashFlowOverview.vue` (new), `src/services/cashFlowCalculations.js` (new), `src/App.vue` (new tab).
**Affected subprojects:** _None explicitly mentioned — single-repo Vue 3 SPA (no subproject split exists in this project)._
**Deferred subprojects:** _None._
**Sequencing notes:** Phase 9 explicitly extends the Income and Expense trackers built in Phases 7 and 8, and reuses the actual-amount editing pattern already established by the Investment Timeline (Phase 4) — those phases must precede it. No phase 10 is currently defined; Phase 9 is the last phase listed in `docs/project-plan.md`.

**Neighbors (for boundary detection only):**

- **Phase 08:** Register expense sources (fixed bills, variable spending, subscriptions) with optional recurrence/end date; generate month-by-month paid/pending projections mirroring the income tracker's data model, with edit/delete matching the Loan Tracker flow.
- **Phase 10:** _No phase 10 defined — Phase 9 is the last phase in `docs/project-plan.md`._

## Decisions Index

| Ref | Source | Scope | Topic | Status | Decision | Libraries |
|-----|--------|-------|-------|--------|----------|-----------|
| cash-flow-overview/TD-01 | phase | Cross-layer | Actual Amount Storage Shape for Received/Paid Entries | decided | A | — |
| cash-flow-overview/TD-02 | phase | Cross-layer | Cash Flow Overview Data Composition Strategy | decided | A | — |
| cash-flow-overview/TD-03 | phase | Cross-layer | Cash Flow Overview Interactivity Scope | decided | B | — |

_Source files:_

- cash-flow-overview — `docs/decisions/technical-decisions-cash-flow-overview.md` (scope_type: phase, related_phases: [9])

_No ad-hoc decisions doc has `related_phases` including `9`._

## Capability Coverage

| Capability (from project-plan.md) | Covered by |
|-----------------------------------|------------|
| Extend the Income and Expense trackers' projection entries so that, once an entry is marked Received/Paid, an editable "actual amount" field appears for that entry (defaulting to the expected/registered amount), mirroring the Investment Timeline's mark-as-Done editable `actualValue` pattern. The edited amount persists per entry and feeds the monthly totals in place of the expected amount. | cash-flow-overview/TD-01 |
| Add a new consolidated Cash Flow Overview screen presenting Income and Expense projections together in a single month-by-month list, showing each entry's Pending/Paid/Received status and actual amount where applicable, plus monthly aggregate totals for Pending, Paid, and Received across both income and expenses. | cash-flow-overview/TD-02, cash-flow-overview/TD-03 |

## Decisions Detail

### cash-flow-overview/TD-01

**Recommendation:** it mirrors the exact migration approach `InvestmentTimeline.vue` already shipped for its own status-shape upgrade, keeps one map instead of two that could drift out of sync, and is the only option that actually satisfies the "persists per entry" requirement the way Timeline's `actualValue` does.
**Decision:** Option A — Upgrade the override value to `{ status, actualAmount }` with a read-time fallback for legacy string values.
**Libraries:** —

### cash-flow-overview/TD-02

**Recommendation:** it is the only option that keeps the new aggregation logic in a pure, independently-testable service module, consistent with every prior phase's separation-of-concerns pattern; the minor duplication of the month-grouping step (already accepted as inline-per-component in Phases 7 and 8) is a smaller cost than moving business logic into a component.
**Decision:** Option A — New `cashFlowCalculations.js` service module + `CashFlowOverview.vue` reading sources from the repository directly.
**Libraries:** —

### cash-flow-overview/TD-03

**Recommendation:** the capability bullet frames the overview as a presentation surface, and Option B's tripled interactive/persistence surface contradicts this app's established one-component-per-domain-mutation pattern for no capability-mandated benefit.
**Decision:** Option B — Fully interactive overview. Rationale (user): a one-stop screen to review and correct the whole month's cash flow is worth duplicating the toggle/edit controls, despite the added surface area to keep in sync.
**Libraries:** —

## Inherited Decisions Detail

### monthly-income-tracker/TD-01 — Income Projection Data Model (Materialized Schedule vs. Rule + Sparse Overrides)

**Recommendation:** the capability explicitly asks for a 35-year projection, which makes an unbounded per-month materialized array (Option A) or a capped window needing runtime expansion (Option C) worse fits than deriving the list on demand; this also reuses the pure-function projection style already established by `financialCalculations.js` rather than the finite-installment style of `loanCalculations.js`, which was designed for schedules with a known end.
**Decision:** Option B — Recurring rule + on-the-fly derivation + sparse status overrides.
**Libraries:** —

### monthly-income-tracker/TD-04 — Received/Pending Default Status Determination

**Recommendation:** it keeps TD-01 Option B's override map sparse (only real exceptions are persisted) and matches this app's existing bias toward optimistic/projected figures, while still letting the user correct any month that didn't go as expected.
**Decision:** Option B — Manual-only default (every month, past or future, defaults to `pending` until explicitly marked received/paid). Rationale (user, Phase 7): no assumptions baked into historical totals; user confirms every month explicitly. For Phase 8, `received` → `paid`.
**Libraries:** —

### tracker-source-edit-delete/TD-02 — Status-Override Handling When a Source Is Edited

**Recommendation:** orphaned map entries are invisible and harmless, while discarding risks losing a user's manually-confirmed history for a class of edits (fixing a date typo) unrelated to the loan precedent's justification.
**Decision:** Option B — Discard `statusOverrides` entirely whenever `startMonth`, `recurring`, or `endMonth` changes, gated by a confirm dialog. Rationale (user): consistency with the established `LoanTracker.vue` precedent for parameter edits outweighs the typo-risk trade-off; the confirm-dialog gate mitigates accidental data loss. Phase 9 note: this reset applies unchanged to the upgraded `{status, actualAmount}` shape — editing those fields discards recorded actual amounts along with status.
**Libraries:** —

## Inherited Conventions

- Pure, side-effect-free calculation module per domain in `src/services/` (`financialCalculations.js`, `loanCalculations.js`, `incomeCalculations.js`, `expenseCalculations.js`), unit-tested via Vitest with no Vue/DOM dependency; the corresponding `.vue` component only orchestrates state and calls into the module. _(from phase 07/08, per [ADR-004](../../adrs/ADR-004-expense-tracker-pattern-reuse.md) / [ADR-002](../../adrs/ADR-002-decoupled-math-service-layer.md))_
- One new encrypted-blob repository key per domain in `indexedDbRepository.js` (`INCOME_KEY`, `EXPENSES_KEY`, `LOANS_KEY`, ...), reusing the existing `get`/`set` convention rather than a new storage mechanism. _(from phase 07)_
- Every dialog (confirmation, warning) is a Vue `ConfirmDialog` component with explicit dismissal only — no native `window.confirm()`/`alert()` — per `.claude/rules/dialog-implementation.md`, already applied to both trackers' parameter-change guard (`showParamsConfirm`) and delete flow. _(from phase 07/08 retrofit, 2026-09-14)_
- Before implementing a new screen, read at least one existing sibling component (a tracker looking at another tracker) to reuse layout/interaction conventions (section header, metric row, list/row shape, modal shape, i18n key structure) per `.claude/rules/ui-pattern-consistency.md`. _(project-wide rule, not phase-specific)_

## Inherited Deferred Capabilities

_No inherited deferred capabilities._

## Inherited Known Issues

_No inherited known issues._

## Non-UI / Deferred Capabilities

| Capability | Status | Rationale | TD refs |
|-----------|--------|-----------|---------|
| (empty on first assembly — plan-resolve appends rows as user marks capabilities) |

## Testing Requirements

### src (single Vue 3 SPA)

_No testing guide available — layer requirements deferred to implementation. Existing convention (observed in `src/services/incomeCalculations.test.js` / `src/services/expenseCalculations.test.js`-style precedent): Vitest unit tests for pure calculation services (`cashFlowCalculations.js` needs its own `.test.js`), plus Vue Test Utils component tests where practical; run via `npx vitest run`._
