---
kind: phase
name: phase-07-monthly-income-tracker
sources_mtime:
  docs/project-plan.md: "2026-09-11T16:22:27"
  docs/decisions/technical-decisions-monthly-income-tracker.md: "2026-09-14T10:06:58"
---

# phase-07-monthly-income-tracker — Context

## Scope

**Phase name:** Monthly Income Registration & Projections

**Capabilities** (literal, `docs/project-plan.md`):

- Register income sources (salary, dividends, received payments), each optionally flagged as recurring; generate a month-by-month projection list (received vs. pending) with monthly totals, projectable up to 35 years.

**Out of scope:** _Not specified._
**Deliverables:** `src/services/incomeCalculations.js` (new), `src/components/IncomeTracker.vue` (new).
**Affected subprojects:** _None explicitly mentioned — single-repo Vue 3 SPA (no subproject split exists in this project)._
**Deferred subprojects:** _None._
**Sequencing notes:** _None._

**Neighbors (for boundary detection only):**

- **Phase 06:** Loan Tracker & Credit Installment Schedules — credit card limit installment scheduling (`generateCreditCardInstallments`) and casual friend loan metrics engine.
- **Phase 08:** _No phase 08 defined — Phase 7 is the last phase in `docs/project-plan.md`._

## Decisions Index

| Ref | Source | Scope | Topic | Status | Decision | Libraries |
|-----|--------|-------|-------|--------|----------|-----------|
| monthly-income-tracker/TD-01 | phase | Cross-layer | Income Projection Data Model | decided | B | — |
| monthly-income-tracker/TD-02 | phase | Cross-layer | Recurrence Cadence Representation | decided | A | — |
| monthly-income-tracker/TD-03 | phase | Cross-layer | Long-Horizon Projection Rendering Strategy | decided | B | — |
| monthly-income-tracker/TD-04 | phase | Cross-layer | Received/Pending Default Status Determination | decided | B | — |

_Source files:_

- monthly-income-tracker — `docs/decisions/technical-decisions-monthly-income-tracker.md` (scope_type: phase, related_phases: [7])

## Capability Coverage

| Capability (from project-plan.md) | Covered by |
|-----------------------------------|------------|
| Register income sources (salary, dividends, received payments), each optionally flagged as recurring; generate a month-by-month projection list (received vs. pending) with monthly totals, projectable up to 35 years. | monthly-income-tracker/TD-01, monthly-income-tracker/TD-02, monthly-income-tracker/TD-03, monthly-income-tracker/TD-04 |

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
