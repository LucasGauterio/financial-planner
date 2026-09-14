---
kind: phase
name: phase-07-monthly-income-tracker
sources_mtime:
  docs/project-plan.md: "2026-09-14T18:55:42"
  docs/decisions/technical-decisions-monthly-income-tracker.md: "2026-09-14T10:06:58"
  docs/decisions/technical-decisions-tracker-source-edit-delete.md: "2026-09-14T18:54:21"
  docs/adrs/ADR-006-tracker-source-edit-delete.md: "2026-09-14T18:54:42"
---

# phase-07-monthly-income-tracker — Context

## Scope

**Phase name:** Monthly Income Registration & Projections

**Capabilities** (literal, `docs/project-plan.md`):

- Register income sources (salary, dividends, received payments), each optionally flagged as recurring; generate a month-by-month projection list (received vs. pending) with monthly totals, projectable up to 35 years. Registered sources can be edited (reopens the registration form pre-filled) or deleted (behind a confirmation step), matching the edit/delete flow established by the Loan Tracker.

**Out of scope:** _Not specified._
**Deliverables:** `src/services/incomeCalculations.js` (new), `src/components/IncomeTracker.vue` (new).
**Affected subprojects:** _None explicitly mentioned — single-repo Vue 3 SPA (no subproject split exists in this project)._
**Deferred subprojects:** _None._
**Sequencing notes:** _None._

**Neighbors (for boundary detection only):**

- **Phase 06:** Loan Tracker & Credit Installment Schedules — credit card limit installment scheduling (`generateCreditCardInstallments`) and casual friend loan metrics engine.
- **Phase 08:** Monthly Expense Registration & Projections — mirrors this phase's data model; the edit/delete capability below (`tracker-source-edit-delete`) applies to both phases symmetrically.

## Decisions Index

| Ref | Source | Scope | Topic | Status | Decision | Libraries |
|-----|--------|-------|-------|--------|----------|-----------|
| monthly-income-tracker/TD-01 | phase | Cross-layer | Income Projection Data Model | decided | B | — |
| monthly-income-tracker/TD-02 | phase | Cross-layer | Recurrence Cadence Representation | decided | A | — |
| monthly-income-tracker/TD-03 | phase | Cross-layer | Long-Horizon Projection Rendering Strategy | decided | B | — |
| monthly-income-tracker/TD-04 | phase | Cross-layer | Received/Pending Default Status Determination | decided | B | — |
| tracker-source-edit-delete/TD-01 | ad-hoc | Cross-layer | Edit & Delete UI Mechanism | decided | A | — |
| tracker-source-edit-delete/TD-02 | ad-hoc | Cross-layer | Status-Override Handling When a Source Is Edited | decided | B | — |

_Source files:_

- monthly-income-tracker — `docs/decisions/technical-decisions-monthly-income-tracker.md` (scope_type: phase, related_phases: [7])
- tracker-source-edit-delete — `docs/decisions/technical-decisions-tracker-source-edit-delete.md` (scope_type: ad-hoc, related_phases: [7, 8])

## Capability Coverage

| Capability (from project-plan.md) | Covered by |
|-----------------------------------|------------|
| Register income sources (salary, dividends, received payments), each optionally flagged as recurring; generate a month-by-month projection list (received vs. pending) with monthly totals, projectable up to 35 years. Registered sources can be edited (reopens the registration form pre-filled) or deleted (behind a confirmation step), matching the edit/delete flow established by the Loan Tracker. | monthly-income-tracker/TD-01, monthly-income-tracker/TD-02, monthly-income-tracker/TD-03, monthly-income-tracker/TD-04, tracker-source-edit-delete/TD-01, tracker-source-edit-delete/TD-02 |

## Decisions Detail

### monthly-income-tracker/TD-01

**Recommendation:** the capability explicitly asks for a 35-year projection, which makes an unbounded per-month materialized array (Option A) or a capped window needing runtime expansion (Option C) worse fits than deriving the list on demand; this also reuses the pure-function projection style already established by `financialCalculations.js` rather than the finite-installment style of `loanCalculations.js`, which was designed for schedules with a known end.
**Libraries:** —

### monthly-income-tracker/TD-02

**Recommendation:** it subsumes Option B's real-world cadences as presets over the same integer field while remaining generic, and it maps directly onto the modulo check the projection derivation (TD-01) needs, avoiding a separate enum-to-interval translation layer.
**Libraries:** —

### monthly-income-tracker/TD-03

**Recommendation:** it reuses the grouped-list rendering pattern already proven in `InvestmentTimeline.vue` without adding a virtualization dependency or hand-rolled scroll-window code, and a horizon selector matches the mental model users already have from the Goal Calculator's timeframe inputs.
**Libraries:** —

### monthly-income-tracker/TD-04

**Recommendation:** it keeps TD-01 Option B's override map sparse (only real exceptions are persisted) and matches this app's existing bias toward optimistic/projected figures (compound-interest and goal projections already assume contributions happen as planned unless the user changes them), while still letting the user correct any month that didn't go as expected.
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

_No inherited TD details._

## Inherited Conventions

_None of the prior phases (1–6) define a `## Conventions to Match` section._

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

_No testing guide available — layer requirements deferred to implementation. Existing convention (observed in `docs/phases/phase-07-monthly-income-tracker/progress.md`): Vitest unit tests for pure calculation services, plus Vue Test Utils component tests; run via `npx vitest run`._
