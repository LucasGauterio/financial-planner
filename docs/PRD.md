# Product Requirements Document (PRD): FinancialPlanner

## 1. Executive Summary
**FinancialPlanner** is a client-side, zero-trust, offline-first Vue 3 Single Page Application (SPA) designed to empower individuals to model, calculate, simulate, and track financial goals, investment timelines, loans, and portfolio allocations with bank-grade local encryption.

---

## 2. User Personas & Core Use Cases
- **Retail Investor / Wealth Builder**: Models long-term compound growth, monthly contribution requirements, and historical asset yields.
- **Goal-Driven Saver**: Calculates exact monthly deposits required to reach target capital milestones within a set timeframe.
- **Private Lender / Credit Limit Tracker**: Tracks personal loans issued to acquaintances or installments spread across credit card limits.
- **Privacy-Conscious User**: Requires complete data privacy where no financial records leave the local browser runtime.

---

## 3. Product Functional Requirements (FR)

| Requirement ID | Module / Area | Feature Description | Priority | Traceability Anchor |
|---|---|---|---|---|
| **FR-001** | `GoalCalculator` | Calculate required monthly contribution to reach target amount over $N$ months with annual deposit inflation escalators. | High | [financialCalculations.js:L20-L50](file:///G:/Projects/FinancialPlanner/src/services/financialCalculations.js#L20-L50) |
| **FR-002** | `InvestmentTimeline` | Project multi-year dynamic monthly/yearly balance timeline based on principal, monthly rate, and contribution increase. | High | [financialCalculations.js:L1-L18](file:///G:/Projects/FinancialPlanner/src/services/financialCalculations.js#L1-L18) |
| **FR-003** | `LoanTracker` | Generate credit card installment schedules with remainder allocation and calculate summary metrics for casual friend loans, with archive/unarchive lifecycle management to declutter settled or inactive loans without deleting their history. | High | [loanCalculations.js:L15-L120](file:///G:/Projects/FinancialPlanner/src/services/loanCalculations.js#L15-L120) |
| **FR-004** | `LockScreen` / Auth | Encrypt persistent data in IndexedDB using Web Crypto API (`PBKDF2` + `AES-GCM-256`) derived from user master password. | Critical | [cryptoService.js:L1-L71](file:///G:/Projects/FinancialPlanner/src/services/cryptoService.js#L1-L71) |
| **FR-005** | `PortfolioTracker` | Track portfolio allocations, yield rates, and net worth distributions with persistent storage. | Medium | [indexedDbRepository.js](file:///G:/Projects/FinancialPlanner/src/services/indexedDbRepository.js) |
| **FR-006** | `PastInvestmentSimulator` | Model historical asset growth based on consistent periodic contributions. | Medium | [PastInvestmentSimulator.vue](file:///G:/Projects/FinancialPlanner/src/components/PastInvestmentSimulator.vue) |
| **FR-007** | `TimeGapComparator` | Compare financial outcomes between starting investments today versus delaying start by $N$ months. | Medium | [TimeGapComparator.vue](file:///G:/Projects/FinancialPlanner/src/components/TimeGapComparator.vue) |
| **FR-008** | `ExpenseTracker` | Register expense sources (fixed bills, variable spending, subscriptions), each optionally flagged as recurring and optionally given an end date (for recurring sources with a known term, e.g. a financed purchase); generate a month-by-month projection (paid vs. pending) with monthly totals, selectable up to a 35-year horizon. | High | `src/services/expenseCalculations.js` (new) |

---

## 4. Non-Functional Requirements (NFR)
- **NFR-001 (Zero-Trust Security)**: Pure client-side encryption via Web Crypto API. No remote database transmission.
- **NFR-002 (Offline-First)**: Complete functionality available without active network connection using IndexedDB and LocalStorage.
- **NFR-003 (i18n & Localization)**: Full bi-lingual dynamic translation (`en-US` and `pt-BR`) with currency-agnostic formatting.
- **NFR-004 (Performance)**: Instant mathematical projection computation (< 50ms) capped to prevent float precision overflow.

---

## 5. Out of Scope / Deferred Items
- **Fixed expense category taxonomy / spending reports by category**: `ExpenseTracker` (FR-008) uses a free-text label for fixed bills, variable spending, and subscriptions; a structured category enum with budgeting or spend-by-category reporting is deferred to a future phase.
- **Non-monthly native recurrence**: quarterly, semi-annual, or annual recurring expenses (and income) are registered as separate one-off entries in this phase; a generic recurrence-interval model is deferred, not part of Phase 8 scope.
