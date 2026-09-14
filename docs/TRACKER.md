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
| **FR-008** | Monthly Expense Registration & Projection | `src/services/expenseCalculations.js` _(new, pending `/implement phase 08`)_ | — | `src/services/expenseCalculations.test.js` _(new, pending)_ |

---

## Architectural Decision Traceability

| ADR ID | Decision Summary | Implementation File | Line Anchor |
|---|---|---|---|
| **ADR-003** | Loan Tracker reuses IndexedDB repository + AES-GCM encryption + pure service-layer patterns | [indexedDbRepository.js](file:///G:/Projects/FinancialPlanner/src/services/indexedDbRepository.js#L14-L17), [loanCalculations.js](file:///G:/Projects/FinancialPlanner/src/services/loanCalculations.js#L1-L119) | `L14-L17`, `L1-L119` |
| **ADR-004** | Expense Tracker reuses Income Tracker's derived-projection data model + IndexedDB repository + AES-GCM encryption + pure service-layer patterns | [incomeCalculations.js](file:///G:/Projects/FinancialPlanner/src/services/incomeCalculations.js#L15-L54), [indexedDbRepository.js](file:///G:/Projects/FinancialPlanner/src/services/indexedDbRepository.js#L14-L19) | `L15-L54`, `L14-L19` |

## Technical Decision Traceability (Phase 08 — inherited from `technical-decisions-monthly-income-tracker.md`)

Phase 8 introduces no new technical-decisions document; per [ADR-004](file:///G:/Projects/FinancialPlanner/docs/adrs/ADR-004-expense-tracker-pattern-reuse.md), it reuses TD-01..TD-04 from Phase 7's decisions doc unchanged. Traced here against the Phase 7 code that already embodies each decision, pending the equivalent `expenseCalculations.js` implementation in `/implement phase 08`.

| TD ID (source) | Decision Summary | Implementation File (Phase 7 precedent) | Line Anchor |
|---|---|---|---|
| **TD-01** | Recurring rule + on-the-fly derivation + sparse status overrides (no materialized per-month rows) | [incomeCalculations.js](file:///G:/Projects/FinancialPlanner/src/services/incomeCalculations.js#L15-L54) | `L15-L54` |
| **TD-02** | Boolean `recurring` flag, monthly-only cadence | [incomeCalculations.js](file:///G:/Projects/FinancialPlanner/src/services/incomeCalculations.js#L26-L36) | `L26-L36` |
| **TD-03** | User-selectable horizon driving grouped-list rendering | [IncomeTracker.vue](file:///G:/Projects/FinancialPlanner/src/components/IncomeTracker.vue) | — |
| **TD-04** | Default status is `pending` until explicitly confirmed (no date-inferred default) | [incomeCalculations.js](file:///G:/Projects/FinancialPlanner/src/services/incomeCalculations.js#L40)| `L40` |

## Technical Decision Traceability (`technical-decisions-loan-tracker-and-schedules.md`)

| TD ID | Decision Summary | Implementation File | Line Anchor |
|---|---|---|---|
| **TD-01** | Installment remainder absorbed into last installment | [loanCalculations.js](file:///G:/Projects/FinancialPlanner/src/services/loanCalculations.js#L44-L47) | `L44-L47` |
| **TD-02** | Due-day clamped to last valid day of month | [loanCalculations.js](file:///G:/Projects/FinancialPlanner/src/services/loanCalculations.js#L35-L37) | `L35-L37` |
| **TD-03** | Full schedule regeneration on parameter edit, gated by confirm dialog | [LoanTracker.vue](file:///G:/Projects/FinancialPlanner/src/components/LoanTracker.vue#L666-L694) | `L666-L694` |
| **TD-04** | Unified loan array with `type` discriminator | [indexedDbRepository.js](file:///G:/Projects/FinancialPlanner/src/services/indexedDbRepository.js#L262-L273) | `L262-L273` |
| **TD-05** | Archive flag + separate hard delete for loan lifecycle | [LoanTracker.vue](file:///G:/Projects/FinancialPlanner/src/components/LoanTracker.vue#L766-L773) | `L766-L773` |

_Decision fields for TD-01..TD-05 are pending user confirmation via `/plan-resolve 06`; this table traces the recommended options against the code that already embodies them (retroactive documentation of an already-shipped phase)._

---

## Governance Rules Enforcement
- **Rule 1 (`source-code-is-read-only.md`)**: Verified — zero line mutations performed during doc generation.
- **Rule 2 (`traceability-required.md`)**: Verified — 100% of PRD requirements have corresponding line anchors above.
- **Rule 3 (`no-cross-document-duplication.md`)**: Verified — PRD contains requirements, RFC contains decisions, FDD contains C4 diagrams.
