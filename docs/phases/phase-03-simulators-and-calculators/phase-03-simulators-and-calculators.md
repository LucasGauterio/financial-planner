# Phase 03: Financial Simulators & Goal Calculators Engine

## Objective
Implement decoupled, pure mathematical calculation services and interactive Vue components for Goal Calculator, Past Investment Simulator, Time Gap Comparator, and Portfolio Tracker.

## Dependency Map
- Depends on Phase 01 and Phase 02.

## Step Implementations (SIs)

### SI-01: Financial Math Service Engine
- Implement pure calculation functions for compound interest, target monthly deposits, and chronological offsets.
- Target files:
  - [`src/services/financialCalculations.js`](file:///G:/Projects/FinancialPlanner/src/services/financialCalculations.js#L1-L120)
- Tests: `npx vitest run src/services/financialCalculations.test.js`.

### SI-02: Interactive Calculator UI Components
- Build `GoalCalculator.vue`, `PastInvestmentSimulator.vue`, `TimeGapComparator.vue`, and `PortfolioTracker.vue`.
- Target files:
  - [`src/components/GoalCalculator.vue`](file:///G:/Projects/FinancialPlanner/src/components/GoalCalculator.vue#L1-L200)
  - [`src/components/PastInvestmentSimulator.vue`](file:///G:/Projects/FinancialPlanner/src/components/PastInvestmentSimulator.vue#L1-L120)
  - [`src/components/TimeGapComparator.vue`](file:///G:/Projects/FinancialPlanner/src/components/TimeGapComparator.vue#L1-L150)
  - [`src/components/PortfolioTracker.vue`](file:///G:/Projects/FinancialPlanner/src/components/PortfolioTracker.vue#L1-L220)
- Tests: `npx vitest run src/components/GoalCalculator.test.js`, `npx vitest run src/components/PastInvestmentSimulator.test.js`, `npx vitest run src/components/TimeGapComparator.test.js`, `npx vitest run src/components/PortfolioTracker.test.js`.

## Deliverables
- 100% test-backed pure calculation service module.
- Interactive Vue components with reactive inputs.
