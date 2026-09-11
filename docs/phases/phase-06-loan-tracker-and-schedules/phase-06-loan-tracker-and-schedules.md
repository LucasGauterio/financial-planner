# Phase 06: Loan Tracker & Credit Installment Schedules

## Objective
Implement credit card limit installment scheduling and casual friend loan metrics calculation engine with date validation and division remainder absorbance.

## Dependency Map
- Depends on Phase 01 and Phase 02.

## Step Implementations (SIs)

### SI-01: Loan Calculation Engine
- Implement `generateCreditCardInstallments`, `calculateCasualLoanSummary`, and `calculateCreditLoanSummary`.
- Target files:
  - [`src/services/loanCalculations.js`](file:///G:/Projects/FinancialPlanner/src/services/loanCalculations.js#L1-L120)
- Tests: `npx vitest run src/services/loanCalculations.test.js`.

### SI-02: Loan Tracker Vue Component
- Build `LoanTracker.vue` for managing casual friend loans and credit card limit installment schedules.
- Target files:
  - [`src/components/LoanTracker.vue`](file:///G:/Projects/FinancialPlanner/src/components/LoanTracker.vue#L1-L250)
- Tests: `npx vitest run`.

## Deliverables
- Loan calculation service engine.
- Interactive LoanTracker Vue component.
