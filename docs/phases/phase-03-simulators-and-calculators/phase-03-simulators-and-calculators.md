# Phase 03: Financial Simulators & Calculators Engine

## Objective
Implement decoupled, pure mathematical calculation services and interactive Vue components for Goal Calculator, Past Investment Simulator, and Time Gap Comparator.

## Dependency Map
- Depends on Phase 01 and Phase 02.

## Step Implementations (SIs)

### SI-01: Financial Math Service Engine
- Implement pure calculation functions for compound interest, target monthly deposits, and chronological offsets.
- Target files: `src/services/financialCalculations.js`, `src/services/loanCalculations.js`.
- Tests: `npx vitest run src/services/financialCalculations.test.js`, `npx vitest run src/services/loanCalculations.test.js`.

### SI-02: Interactive Calculator UI Components
- Build `GoalCalculator.vue`, `PastInvestmentSimulator.vue`, `TimeGapComparator.vue`, and `PortfolioTracker.vue`.
- Target files: `src/components/*.vue`.
- Tests: `npx vitest run`.

## Deliverables
- 100% test-backed pure calculation service module.
- Interactive Vue components with reactive inputs.
