# Requirements Traceability Matrix (TRACKER.md)

This document maps all product requirements defined in [PRD.md](file:///G:/Projects/FinancialPlanner/docs/PRD.md) directly to implementation files and line numbers in the source code.

---

## Traceability Mapping Table

| Requirement ID | Requirement Summary | Implementation File | Line Anchor | Verification Test File |
|---|---|---|---|---|
| **FR-001** | Goal Deposit Calculation | [financialCalculations.js](file:///G:/Projects/FinancialPlanner/src/services/financialCalculations.js#L20-L50) | `L20-L50` | [financialCalculations.test.js](file:///G:/Projects/FinancialPlanner/src/services/financialCalculations.test.js) |
| **FR-002** | Compound Interest Timeline | [financialCalculations.js](file:///G:/Projects/FinancialPlanner/src/services/financialCalculations.js#L1-L18) | `L1-L18` | [financialCalculations.test.js](file:///G:/Projects/FinancialPlanner/src/services/financialCalculations.test.js) |
| **FR-003** | Installments & Loan Summary | [loanCalculations.js](file:///G:/Projects/FinancialPlanner/src/services/loanCalculations.js#L15-L120) | `L15-L120` | [loanCalculations.test.js](file:///G:/Projects/FinancialPlanner/src/services/loanCalculations.test.js) |
| **FR-004** | Master Key Derivation & AES Encryption | [cryptoService.js](file:///G:/Projects/FinancialPlanner/src/services/cryptoService.js#L1-L71) | `L1-L71` | [cryptoService.test.js](file:///G:/Projects/FinancialPlanner/src/services/cryptoService.test.js) |
| **FR-005** | Portfolio Allocation Tracking | [PortfolioTracker.vue](file:///G:/Projects/FinancialPlanner/src/components/PortfolioTracker.vue#L1-L250) | `L1-L250` | [PortfolioTracker.test.js](file:///G:/Projects/FinancialPlanner/src/components/PortfolioTracker.test.js) |
| **FR-006** | Historical Yield Simulation | [PastInvestmentSimulator.vue](file:///G:/Projects/FinancialPlanner/src/components/PastInvestmentSimulator.vue#L1-L120) | `L1-L120` | [PastInvestmentSimulator.test.js](file:///G:/Projects/FinancialPlanner/src/components/PastInvestmentSimulator.test.js) |
| **FR-007** | Time Gap Opportunity Cost | [TimeGapComparator.vue](file:///G:/Projects/FinancialPlanner/src/components/TimeGapComparator.vue#L1-L150) | `L1-L150` | [TimeGapComparator.test.js](file:///G:/Projects/FinancialPlanner/src/components/TimeGapComparator.test.js) |

---

## Governance Rules Enforcement
- **Rule 1 (`source-code-is-read-only.md`)**: Verified — zero line mutations performed during doc generation.
- **Rule 2 (`traceability-required.md`)**: Verified — 100% of PRD requirements have corresponding line anchors above.
- **Rule 3 (`no-cross-document-duplication.md`)**: Verified — PRD contains requirements, RFC contains decisions, FDD contains C4 diagrams.
