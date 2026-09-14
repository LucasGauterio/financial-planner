---
kind: phase
name: phase-06-loan-tracker-and-schedules
sources_mtime:
  docs/project-plan.md: "2026-09-11T16:22:27-03:00"
  docs/decisions/technical-decisions-loan-tracker-and-schedules.md: "2026-09-14T14:05:07-03:00"
---

# phase-06-loan-tracker-and-schedules — Context

## Scope

**Phase name:** Loan Tracker & Credit Installment Schedules

**Capabilities** (literal, `docs/project-plan.md`):

- Implement credit card limit installment scheduling (`generateCreditCardInstallments`) and casual friend loan metrics engine.

**Out of scope:** _Not specified._ No explicit "Out of scope" line in `docs/project-plan.md` for this phase; the single capability bullet covers credit card installment scheduling and casual friend loan metrics only — anything beyond that (e.g. other loan types, interest/amortization schedules) is not mentioned.

**Deliverables:** Target files: [`src/services/loanCalculations.js`](../../../src/services/loanCalculations.js#L1-L119), [`src/components/LoanTracker.vue`](../../../src/components/LoanTracker.vue#L1-L250).

**Affected subprojects:** Single Vue 3 SPA at repo root — `src/services/loanCalculations.js`, `src/components/LoanTracker.vue`. No separate backend/frontend subproject split exists in this repo.

**Deferred subprojects:** None — single SPA project.

**Sequencing notes:** Not present in `docs/project-plan.md` itself. Per `docs/phases/phase-06-loan-tracker-and-schedules/phase-06-loan-tracker-and-schedules.md`: "Depends on Phase 01 and Phase 02."

**Neighbors (for boundary detection only):**

- **Phase 05:** i18n Localization & Vault Backup Automation — reactive i18n hook (`useI18n.js`) with dual locale dictionaries (`en-US`, `pt-BR`) and encrypted vault backup export.
- **Phase 07:** Monthly Income Registration & Projections — register income sources, each optionally flagged as recurring; generate a month-by-month projection list (received vs. pending) with monthly totals, projectable up to 35 years.

## Decisions Index

| Ref | Source | Scope | Topic | Status | Decision | Libraries |
|-----|--------|-------|-------|--------|----------|-----------|
| loan-tracker-and-schedules/TD-01 | phase | Cross-layer | Installment Remainder Absorption Strategy | decided | Option A — Absorb the entire remainder into the last installment. | — |
| loan-tracker-and-schedules/TD-02 | phase | Cross-layer | Due-Day-of-Month Overflow Handling | decided | Option A — Clamp the day down to the last valid day of the month. | — |
| loan-tracker-and-schedules/TD-03 | phase | Cross-layer | Schedule Regeneration on Parameter Edit | decided | Option A — Full regenerate, gated by a confirm dialog. | — |
| loan-tracker-and-schedules/TD-04 | phase | Cross-layer | Loan Type Data Model — Unified Collection with Type Discriminator | decided | Option A — Single array with a `type` discriminator field. | — |
| loan-tracker-and-schedules/TD-05 | phase | Cross-layer | Loan Lifecycle Visibility — Archive Flag vs. Deletion | decided | Option A — Soft-hide via `archived` boolean, with a separate hard delete. | — |

_Source files:_

- loan-tracker-and-schedules — `docs/decisions/technical-decisions-loan-tracker-and-schedules.md` (scope_type: phase)

## Capability Coverage

| Capability (from project-plan.md) | Covered by |
|-----------------------------------|------------|
| Implement credit card limit installment scheduling (`generateCreditCardInstallments`) and casual friend loan metrics engine. | loan-tracker-and-schedules/TD-01, loan-tracker-and-schedules/TD-02, loan-tracker-and-schedules/TD-03, loan-tracker-and-schedules/TD-04, loan-tracker-and-schedules/TD-05 |

## Decisions Detail

### loan-tracker-and-schedules/TD-01

**Recommendation:** it keeps the form's "estimated installment" preview consistent with every generated row except the last, and mirrors the everyday "final payment adjusts" convention users already expect from real credit card statements.
**Libraries:** —

### loan-tracker-and-schedules/TD-02

**Recommendation:** clamping is the only option that preserves the generation loop's month-per-installment invariant while matching the everyday expectation of a billing due date, without over-restricting valid input.
**Libraries:** —

### loan-tracker-and-schedules/TD-03

**Recommendation:** the `confirm()` guard already surfaces the destructive consequence before it happens, which is a reasonable trade for keeping schedule generation a single deterministic function of its parameters rather than introducing installment-identity-preserving merge logic that Option B would require.
**Libraries:** —

### loan-tracker-and-schedules/TD-04

**Recommendation:** it matches this app's established one-key-per-domain repository convention and lets the stats dashboard and combined filter tabs operate on one list, at the cost of type-branching the UI needs regardless since casual and credit loans render genuinely different sections.
**Libraries:** —

### loan-tracker-and-schedules/TD-05

**Recommendation:** it's the only option that lets users declutter their primary view independently of payoff status without discarding history, while keeping hard deletion available as a distinct action for loans the user genuinely wants removed.
**Libraries:** —

## Inherited Decisions Detail

_No inherited TD details._

## Inherited Conventions

- One `_KEY` constant per domain in `indexedDbRepository.js` (e.g. `LOANS_KEY = 'financial_planner_loans'`) _(from phase 02)_
- Repository `get(key)`/`set(key, value)` async pattern: decrypt-on-read via `decryptValue`, encrypt-on-write via `encryptData` _(from phase 02)_
- All persisted values pass through AES-GCM `encryptData`/`decryptData`; app must be unlocked (`isUnlocked`) to read/write _(from phase 02)_
- New domain keys get included in `saveBackupSnapshot()`'s `currentData` map for vault export _(from phase 02/05)_
- Calculation logic lives in pure, side-effect-free functions in a dedicated `src/services/*Calculations.js` file _(from phase 03)_
- Pure calc functions covered by dedicated Vitest spec files (`*.test.js`) run via `npx vitest run` _(from phase 03)_
- UI built as `<script setup>` Vue 3 SFCs in `src/components/`, one component per tracker/feature _(from phase 01/03)_
- Numeric results capped at `maxVal = 999999999999999` to avoid unbounded float growth _(from phase 03)_
- i18n strings sourced via `useI18n.js` composable with `en-US`/`pt-BR` dictionaries, not hardcoded _(from phase 05)_

## Inherited Deferred Capabilities

_No inherited deferred capabilities._

## Inherited Known Issues

_No inherited known issues._

## Non-UI / Deferred Capabilities

_None._

## Testing Requirements

### src/ (single Vue 3 SPA)

_No testing guide available — layer requirements deferred to implementation._ (No `testing-guide-*` skill exists for this Vue/Vitest stack; the only registered testing guides in this environment target `nestjs-project` and `next-frontend`, neither applicable here.)
