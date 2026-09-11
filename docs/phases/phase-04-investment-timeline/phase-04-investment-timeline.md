# Phase 04: Dynamic Life Investment Timeline

## Objective
Build a dynamic, row-based interactive timeline projecting net worth and portfolio growth months and years into the future.

## Dependency Map
- Depends on Phase 03 financial math engine.

## Step Implementations (SIs)

### SI-01: Timeline Projection Service & History Tracking
- Implement row-based calculation routines projecting balances across months/years.
- Target files:
  - [`src/services/financialCalculations.js`](file:///G:/Projects/FinancialPlanner/src/services/financialCalculations.js#L1-L18)
  - [`src/services/indexedDbRepository.js`](file:///G:/Projects/FinancialPlanner/src/services/indexedDbRepository.js#L80-L110)

### SI-02: Investment Timeline Vue Component
- Build `InvestmentTimeline.vue` with interactive row rendering and automatic balance syncing.
- Target files:
  - [`src/components/InvestmentTimeline.vue`](file:///G:/Projects/FinancialPlanner/src/components/InvestmentTimeline.vue#L1-L180)
- Tests: `npx vitest run src/components/InvestmentTimeline.test.js`.

## Deliverables
- Dynamic, interactive investment timeline component.
