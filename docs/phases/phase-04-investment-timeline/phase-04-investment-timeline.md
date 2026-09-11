# Phase 04: Dynamic Life Investment Timeline

## Objective
Build a dynamic, row-based interactive timeline projecting net worth and portfolio growth months and years into the future.

## Dependency Map
- Depends on Phase 03 financial math engine.

## Step Implementations (SIs)

### SI-01: Timeline Projection Service
- Implement row-based calculation routines projecting balances across months/years.
- Target files: `src/services/financialCalculations.js`.

### SI-02: Investment Timeline Vue Component
- Build `InvestmentTimeline.vue` with interactive row rendering and automatic balance syncing.
- Target files: `src/components/InvestmentTimeline.vue`.
- Tests: `npx vitest run src/components/InvestmentTimeline.test.js`.

## Deliverables
- Dynamic, interactive investment timeline component.
