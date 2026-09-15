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
| **FR-009** | `IncomeTracker`, `ExpenseTracker` | Edit a previously registered income or expense source (reopens the registration form pre-filled) and delete it (behind a confirmation step), matching the edit/delete flow already available in `LoanTracker`. Changing a source's start month, recurring flag, or end date clears its recorded paid/received history for that source (confirmed before applying). | High | [LoanTracker.vue](file:///G:/Projects/FinancialPlanner/src/components/LoanTracker.vue#L605-L764) (reference pattern) |
| **FR-010** | `IncomeTracker`, `ExpenseTracker` | Once a projection entry is marked Received/Paid, edit the actual amount received/paid for that entry (defaulting to the registered expected amount), matching the mark-as-Done editable amount flow already available in `InvestmentTimeline`. The edited amount persists and is used in place of the expected amount for that entry's monthly totals. | High | [InvestmentTimeline.vue](file:///G:/Projects/FinancialPlanner/src/components/InvestmentTimeline.vue#L122-L147) (reference pattern) |
| **FR-011** | `CashFlowOverview` (new) | Present Income and Expense projections together in one consolidated, month-by-month screen, showing each entry's Pending/Paid/Received status and actual amount, with combined monthly totals for Pending, Paid, and Received across both income and expenses; entries remain editable from this screen the same way they are from `IncomeTracker`/`ExpenseTracker`. | High | `src/components/CashFlowOverview.vue` (new) |
| **FR-012** | `IncomeTracker`, `ExpenseTracker` | Restyle both trackers to match `LoanTracker`'s visual pattern: a stats dashboard row, registered sources as a card grid (hover-revealed edit/delete actions), and a per-source detail drawer (opened by clicking a card) showing that source's own month-by-month projection with status-toggle and actual-amount editing — replacing the single combined projection list previously shown inline below the source list. `CashFlowOverview` is unaffected. | Medium | [LoanTracker.vue](file:///G:/Projects/FinancialPlanner/src/components/LoanTracker.vue#L1-L1681) (reference pattern) |
| **FR-013** | `IncomeTracker`, `ExpenseTracker` | Replace the Projection Horizon `<select>` dropdown with a ruler-slider input matching `PortfolioTracker`'s existing horizon slider (capped at the trackers' existing 35-year ceiling). The selected horizon value, its default, and its effect on projections are unchanged. | Low | [PortfolioTracker.vue](file:///G:/Projects/FinancialPlanner/src/components/PortfolioTracker.vue#L1-L40) (reference pattern) |
| **FR-014** | `IncomeTracker` | Recurring income sources can optionally be given an end date (for sources with a known term, e.g. a fixed-term contract), so the source stops projecting after that month instead of recurring indefinitely — the identical `endMonth` capability already available on `ExpenseTracker` (FR-008), applied symmetrically. | Medium | `src/services/incomeCalculations.js` (reference: `expenseCalculations.js`) |
| **FR-015** | `IncomeTracker`, `ExpenseTracker` | A recurring source with an end date always projects its complete start-to-end span, regardless of the selected Projection Horizon — the horizon slider only governs sources with no end date. Previously a bounded source could be truncated at the horizon before reaching its own defined end. | High | `src/services/incomeCalculations.js`, `src/services/expenseCalculations.js` |
| **FR-016** | `IncomeTracker`, `ExpenseTracker` | The Projection Horizon slider steps month by month (1-420 months) instead of year by year (1-35 years), and defaults to a near-term view instead of a full year ahead — matching the monthly granularity used everywhere else in these trackers. | Medium | `src/components/IncomeTracker.vue`, `src/components/ExpenseTracker.vue` |
| **FR-017** | `CashFlowOverview` | Replace the Projection Horizon `<select>` dropdown with the identical month-by-month ruler slider used by `PortfolioTracker`/`IncomeTracker`/`ExpenseTracker` (1-420 months). | Low | `src/components/CashFlowOverview.vue` |
| **FR-018** | `IncomeTracker`, `ExpenseTracker` | The stats dashboard (total/received-or-paid/pending) aggregates only the months within the selected Projection Horizon window, not every projected entry — so old unconfirmed backlog and a bounded source's full future span no longer inflate the dashboard's figures beyond what the horizon slider visually represents. The per-source detail drawer is unaffected and still shows the complete projection. | High | `src/components/IncomeTracker.vue`, `src/components/ExpenseTracker.vue` |
| **FR-019** | `IncomeTracker`, `ExpenseTracker`, `CashFlowOverview` | The Projection Horizon slider defaults to `1` month (the current month only) instead of `3`, so all three screens open scoped to just the current month; the user still drags the slider to widen the view. | Medium | `src/components/IncomeTracker.vue`, `src/components/ExpenseTracker.vue`, `src/components/CashFlowOverview.vue` |

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
- **Legacy status-override migration sweep**: Phase 9's actual-amount storage upgrade reads old and new override shapes side by side indefinitely (FR-010); a one-time migration that normalizes every persisted source to the new shape is deferred, not part of Phase 9 scope.
- **Income/Expense source lifecycle (archive/complete) and filter tabs**: FR-012's restyle does not carry over `LoanTracker`'s active/completed/archived/all filter tabs, since income/expense sources have no equivalent lifecycle concept today; introducing one is deferred, not part of Phase 10 scope.
