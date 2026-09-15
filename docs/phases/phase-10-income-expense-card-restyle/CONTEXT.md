---
kind: phase
name: phase-10-income-expense-card-restyle
sources_mtime:
  docs/project-plan.md: "2026-09-14T20:35:56"
  docs/adrs/ADR-008-income-expense-card-restyle.md: "2026-09-14T20:36:33"
---

# phase-10-income-expense-card-restyle — Context

## Scope

**Phase name:** Income/Expense Tracker Card & Drawer Restyle

**Capabilities** (literal, `docs/project-plan.md`):

- Restyle `IncomeTracker.vue` and `ExpenseTracker.vue` to visually and structurally match `LoanTracker.vue`: a stats dashboard row (e.g. total registered / received-or-paid / pending across the selected horizon), registered sources rendered as a card grid (hover-revealed edit/delete action icons instead of always-visible ones), and a per-source detail drawer (slide-in panel, opened by clicking a card) that shows that source's own month-by-month projection list — with the existing status-toggle and actual-amount editing controls — replacing today's single combined projection list rendered inline below the source list.
- The Cash Flow Overview screen (Phase 9) is explicitly out of scope for this restyle and keeps its current combined list-based layout.

**Out of scope:** Income/Expense source lifecycle (archive/complete) and `LoanTracker`'s filter tabs (active/completed/archived/all) — deferred, see `docs/PRD.md` § Out of Scope / Deferred Items and `docs/RFC.md` § Open Questions / Future Roadmap. Restyling `CashFlowOverview.vue` is also explicitly out of scope (user decision).
**Deliverables:** Target files: [`src/components/LoanTracker.vue`](../../../src/components/LoanTracker.vue#L1-L1681) (reference pattern), `src/components/IncomeTracker.vue`, `src/components/ExpenseTracker.vue`.
**Affected subprojects:** _None explicitly mentioned — single-repo Vue 3 SPA (no subproject split exists in this project)._
**Deferred subprojects:** _None._
**Sequencing notes:** Phase 10 restyles the trackers built in Phases 7, 8, and 9 (the per-source drawer reuses Phase 9's `toggleStatus`/`displayActualAmount`/`setActualAmount` functions unchanged) onto the visual pattern already established by Phase 6 (`LoanTracker.vue`). No phase 11 is currently defined; Phase 10 is the last phase listed in `docs/project-plan.md`.

**Neighbors (for boundary detection only):**

- **Phase 09:** Editable Actual Amounts & Consolidated Cash Flow Overview — introduced the `{status, actualAmount}` override shape and the `CashFlowOverview.vue` screen, both reused/left unchanged by Phase 10.
- **Phase 11:** _No phase 11 defined — Phase 10 is the last phase in `docs/project-plan.md`._

## Decisions Index

_No phase-scope decisions document for Phase 10 — the target pattern (`LoanTracker.vue`'s stats/cards/drawer) is a fully specified, already-shipped sibling component, not a new architectural choice with competing alternatives. Per the `/research` skip criteria (mirroring how Phase 8 treated its core capability as inheriting Phase 7's decisions, per [ADR-004](../../adrs/ADR-004-expense-tracker-pattern-reuse.md)), the three genuinely open points (drawer vs. combined list, stats dashboard yes/no, Cash Flow Overview in/out of scope) were resolved directly with the user and recorded in [ADR-008](../../adrs/ADR-008-income-expense-card-restyle.md) rather than in a decisions document. No ad-hoc decisions doc has `related_phases` including `10`._

## Capability Coverage

| Capability (from project-plan.md) | Covered by |
|-----------------------------------|------------|
| Restyle `IncomeTracker.vue` and `ExpenseTracker.vue`... (stats dashboard, card grid, per-source detail drawer) | [ADR-008](../../adrs/ADR-008-income-expense-card-restyle.md) (pattern-reuse ADR, no TD) |
| Cash Flow Overview explicitly out of scope | [ADR-008](../../adrs/ADR-008-income-expense-card-restyle.md) |

## Decisions Detail

_No current-scope TDs._

## Inherited Decisions Detail

### cash-flow-overview/TD-01 — Actual Amount Storage Shape for Received/Paid Entries

**Recommendation:** it mirrors the exact migration approach `InvestmentTimeline.vue` already shipped for its own status-shape upgrade, keeps one map instead of two that could drift out of sync, and is the only option that actually satisfies the "persists per entry" requirement the way Timeline's `actualValue` does.
**Decision:** Option A — Upgrade the override value to `{ status, actualAmount }` with a read-time fallback for legacy string values.
**Libraries:** —

### tracker-source-edit-delete/TD-01 — Edit & Delete UI Mechanism

**Recommendation:** it introduces no new interaction pattern (every edit/delete flow in the app becomes visually and behaviorally consistent), and the implementation cost is minimal since the add modal and its `form` reactive object already exist in both trackers; this exactly mirrors `LoanTracker.vue`'s already-proven `editLoan`/`saveLoan`/`deleteLoan`/`confirmDeleteLoan` shape.
**Decision:** Option A — Reuse the LoanTracker pattern verbatim (populated add-modal for edit, dedicated confirm modal for delete).
**Libraries:** —

## Inherited Conventions

- Pure, side-effect-free calculation module per domain in `src/services/` (`financialCalculations.js`, `loanCalculations.js`, `incomeCalculations.js`, `expenseCalculations.js`, `cashFlowCalculations.js`), unit-tested via Vitest with no Vue/DOM dependency; the corresponding `.vue` component only orchestrates state and calls into the module. _(from phase 07/08/09)_
- Every dialog (confirmation, warning) is a Vue `ConfirmDialog` component with explicit dismissal only — no native `window.confirm()`/`alert()` — per `.claude/rules/dialog-implementation.md`. _(from phase 07/08 retrofit)_
- Before implementing a new screen or restyling an existing one, read at least one existing sibling component of the same kind to reuse layout/interaction conventions (section header, card grid, modal shape, drawer shape, i18n key structure) per `.claude/rules/ui-pattern-consistency.md`. _(project-wide rule — this phase's entire scope is an application of this rule)_
- Read-only template bindings never mutate state as a side effect; explicit user-input handlers (`@input`/`@blur`) own all writes. _(from phase 09, learned the hard way during SI-09.2 — see `docs/phases/phase-09-cash-flow-overview/progress.md`)_

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

_No testing guide available — layer requirements deferred to implementation. Existing convention: Vitest unit tests for pure calculation services, plus Vue Test Utils component tests covering the new card-grid/drawer DOM shape (mirroring `LoanTracker.test.js`'s conventions where applicable); run via `npx vitest run`._
