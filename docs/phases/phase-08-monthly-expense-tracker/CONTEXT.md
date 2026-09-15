---
kind: phase
name: phase-08-monthly-expense-tracker
sources_mtime:
  docs/project-plan.md: "2026-09-14T18:55:42"
  docs/decisions/technical-decisions-monthly-income-tracker.md: "2026-09-14T10:06:58"
  docs/decisions/technical-decisions-expense-recurring-end-date.md: "2026-09-14T18:38:36"
  docs/decisions/technical-decisions-tracker-source-edit-delete.md: "2026-09-14T18:54:21"
  docs/adrs/ADR-004-expense-tracker-pattern-reuse.md: "2026-09-14T17:44:49"
  docs/adrs/ADR-005-expense-recurring-end-date.md: "2026-09-14T18:39:00"
  docs/adrs/ADR-006-tracker-source-edit-delete.md: "2026-09-14T18:54:42"
  docs/phases/phase-07-monthly-income-tracker/CONTEXT.md: "2026-09-14T18:56:39"
---

# phase-08-monthly-expense-tracker — Context

## Scope

**Phase name:** Monthly Expense Registration & Projections

**Capabilities** (literal, `docs/project-plan.md`):

- Register expense sources (fixed bills, variable spending, subscriptions), each optionally flagged as recurring and optionally given an end date for bounded-term recurring sources; generate a month-by-month projection list (paid vs. pending) with monthly totals, projectable up to 35 years, mirroring the income tracker's data model. Registered sources can be edited (reopens the registration form pre-filled) or deleted (behind a confirmation step), matching the edit/delete flow established by the Loan Tracker.

**Out of scope:** Fixed expense category taxonomy / spending reports by category (deferred — see `docs/PRD.md` § Out of Scope / Deferred Items); non-monthly native recurrence (deferred — see `docs/RFC.md` § Open Questions / Future Roadmap).
**Deliverables:** `src/services/expenseCalculations.js` (new), `src/components/ExpenseTracker.vue` (new).
**Affected subprojects:** _None explicitly mentioned — single-repo Vue 3 SPA (no subproject split exists in this project)._
**Deferred subprojects:** _None._
**Sequencing notes:** No new technical-decisions document was produced for this phase — `/research phase 08` concluded the capability maps entirely onto Phase 7's decided TDs (see [ADR-004](../../adrs/ADR-004-expense-tracker-pattern-reuse.md)). All decisions below are inherited from `technical-decisions-monthly-income-tracker.md`, not re-decided.

**Neighbors (for boundary detection only):**

- **Phase 07:** Monthly Income Registration & Projections — register income sources, each optionally flagged as recurring; generate a month-by-month projection list (received vs. pending) with monthly totals, projectable up to 35 years. Phase 8 mirrors this phase's data model exactly.
- **Phase 09:** _No phase 09 defined — Phase 8 is the last phase in `docs/project-plan.md`._

## Decisions Index

_No phase-scope decisions document for Phase 8 — `/research phase 08` determined the core capability maps to TDs already decided in `technical-decisions-monthly-income-tracker.md` (Phase 7). Ad-hoc TDs tied to Phase 8 (`related_phases` including `8`) were added afterward:_

| Ref | Source | Scope | Topic | Status | Decision | Libraries |
|-----|--------|-------|-------|--------|----------|-----------|
| expense-recurring-end-date/TD-01 | ad-hoc | Cross-layer | Recurring Expense End Date Representation | decided | A | — |
| tracker-source-edit-delete/TD-01 | ad-hoc | Cross-layer | Edit & Delete UI Mechanism | decided | A | — |
| tracker-source-edit-delete/TD-02 | ad-hoc | Cross-layer | Status-Override Handling When a Source Is Edited | decided | B | — |

_Source files:_

- expense-recurring-end-date — `docs/decisions/technical-decisions-expense-recurring-end-date.md` (scope_type: ad-hoc, related_phases: [8])
- tracker-source-edit-delete — `docs/decisions/technical-decisions-tracker-source-edit-delete.md` (scope_type: ad-hoc, related_phases: [7, 8])

See `## Inherited Decisions Detail` below and [ADR-004](../../adrs/ADR-004-expense-tracker-pattern-reuse.md) for the core-capability reuse rationale.

## Capability Coverage

| Capability (from project-plan.md) | Covered by |
|-----------------------------------|------------|
| Register expense sources (fixed bills, variable spending, subscriptions), each optionally flagged as recurring and optionally given an end date for bounded-term recurring sources; generate a month-by-month projection list (paid vs. pending) with monthly totals, projectable up to 35 years, mirroring the income tracker's data model. Registered sources can be edited (reopens the registration form pre-filled) or deleted (behind a confirmation step), matching the edit/delete flow established by the Loan Tracker. | monthly-income-tracker/TD-01, monthly-income-tracker/TD-02, monthly-income-tracker/TD-03, monthly-income-tracker/TD-04 _(inherited — see below)_, expense-recurring-end-date/TD-01, tracker-source-edit-delete/TD-01, tracker-source-edit-delete/TD-02 |

## Decisions Detail

### expense-recurring-end-date/TD-01 — Recurring Expense End Date Representation

**Recommendation:** a nullable `endMonth` mirrors `startMonth`'s existing `'YYYY-MM'` shape and UI control, requires the smallest change to `generateExpenseProjection`'s loop (one additional bound check), and keeps every already-registered recurring expense source behaviorally unchanged (absent field = current behavior).
**Decision:** Option A — Optional `endMonth` field (nullable `'YYYY-MM'` string, inclusive).
**Libraries:** —

### tracker-source-edit-delete/TD-01 — Edit & Delete UI Mechanism

**Recommendation:** it introduces no new interaction pattern (every edit/delete flow in the app becomes visually and behaviorally consistent), and the implementation cost is minimal since the add modal and its `form` reactive object already exist in both trackers; this exactly mirrors `LoanTracker.vue`'s already-proven `editLoan`/`saveLoan`/`deleteLoan`/`confirmDeleteLoan` shape.
**Decision:** Option A — Reuse the LoanTracker pattern verbatim (populated add-modal for edit, dedicated confirm modal for delete).
**Libraries:** —

### tracker-source-edit-delete/TD-02 — Status-Override Handling When a Source Is Edited

**Recommendation:** orphaned map entries are invisible and harmless, while discarding risks losing a user's manually-confirmed history for a class of edits (fixing a date typo) unrelated to the loan precedent's justification.
**Decision:** Option B — Discard `statusOverrides` entirely whenever `startMonth`, `recurring`, or `endMonth` changes, gated by a confirm dialog. Rationale (user): consistency with the established `LoanTracker.vue` precedent for parameter edits outweighs the typo-risk trade-off; the confirm-dialog gate mitigates accidental data loss.
**Libraries:** —

## Inherited Decisions Detail

### monthly-income-tracker/TD-01 — Income Projection Data Model (Materialized Schedule vs. Rule + Sparse Overrides)

**Recommendation:** the capability explicitly asks for a 35-year projection, which makes an unbounded per-month materialized array (Option A) or a capped window needing runtime expansion (Option C) worse fits than deriving the list on demand; this also reuses the pure-function projection style already established by `financialCalculations.js` rather than the finite-installment style of `loanCalculations.js`, which was designed for schedules with a known end.
**Decision:** Option B — Recurring rule + on-the-fly derivation + sparse status overrides.
**Libraries:** —

### monthly-income-tracker/TD-02 — Recurrence Cadence Representation

**Recommendation:** it subsumes Option B's real-world cadences as presets over the same integer field while remaining generic, and it maps directly onto the modulo check the projection derivation (TD-01) needs, avoiding a separate enum-to-interval translation layer.
**Decision:** Option A — Boolean `recurring` flag, monthly only. Rationale (user, Phase 7): matches the primary use case and keeps the form simplest; non-monthly recurring items are registered as separate one-off entries.
**Libraries:** —

### monthly-income-tracker/TD-03 — Long-Horizon Projection Rendering Strategy

**Recommendation:** it reuses the grouped-list rendering pattern already proven in `InvestmentTimeline.vue` without adding a virtualization dependency or hand-rolled scroll-window code, and a horizon selector matches the mental model users already have from the Goal Calculator's timeframe inputs.
**Decision:** Option B — User-selectable horizon, defaulting to a short window with an option to view up to 35 years.
**Libraries:** —

### monthly-income-tracker/TD-04 — Received/Pending Default Status Determination

**Recommendation:** it keeps TD-01 Option B's override map sparse (only real exceptions are persisted) and matches this app's existing bias toward optimistic/projected figures, while still letting the user correct any month that didn't go as expected.
**Decision:** Option B — Manual-only default (every month, past or future, defaults to `pending` until explicitly marked received/paid). Rationale (user, Phase 7): no assumptions baked into historical totals; user confirms every month explicitly. For Phase 8, `received` → `paid`.
**Libraries:** —

## Inherited Conventions

- Pure, side-effect-free calculation module per domain in `src/services/` (`financialCalculations.js`, `loanCalculations.js`, `incomeCalculations.js`), unit-tested via Vitest with no Vue/DOM dependency; the corresponding `.vue` component only orchestrates state and calls into the module. _(from phase 07, per [ADR-004](../../adrs/ADR-004-expense-tracker-pattern-reuse.md) / [ADR-002](../../adrs/ADR-002-decoupled-math-service-layer.md))_
- One new encrypted-blob repository key per domain in `indexedDbRepository.js` (`INCOME_KEY`, `LOANS_KEY`, ...), reusing the existing `get`/`set` convention rather than a new storage mechanism. _(from phase 07)_
- Free-text `type` field for source categorization/labeling (no enum), used for display only. _(from phase 07)_

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

_No testing guide available — layer requirements deferred to implementation. Existing convention (observed in `docs/phases/phase-07-monthly-income-tracker/progress.md` and `src/services/incomeCalculations.test.js`-style precedent): Vitest unit tests for pure calculation services, plus Vue Test Utils component tests; run via `npx vitest run`._
