# FinancialPlanner — Greenfield Project Plan

## Executive Summary & Overview

FinancialPlanner is a Vue 3 Single Page Application (SPA) designed for tracking, calculating, and simulating financial growth, investment goals, portfolio yields, loans, and life-long net worth timelines.

The application follows a **Zero-Trust Client Security Architecture** using native Web Crypto API (`PBKDF2` key derivation, `AES-GCM` vault encryption) before persisting state in browser `IndexedDB` or `LocalStorage`.

---

## Repository Structure & Subprojects

- `src/components/` — Vue 3 UI single-file components (`.vue`) using `<script setup>` syntax.
- `src/services/` — Pure mathematical calculation functions (`financialCalculations.js`, `loanCalculations.js`) covered by Vitest unit tests.
- `src/composables/` — Vue 3 reactive hooks (`useAuth.js`, `useI18n.js`, `useStorage.js`).
- `src/locales/` — Reactive translation dictionaries (`en-US.js`, `pt-BR.js`).
- `docs/` — System documentation, PRD, RFC, FDD, ADRs, TRACKER, and Greenfield phase plans.

---

## Phased Implementation Roadmap

### Phase 1: Core Setup & State Infrastructure (`docs/phases/phase-01-core-setup/`)
- Establish Vue 3 + Vite build toolchain, Vitest runner, and Vanilla CSS design tokens.
- Target files: [`vite.config.js`](file:///G:/Projects/FinancialPlanner/vite.config.js#L1-L20), [`src/style.css`](file:///G:/Projects/FinancialPlanner/src/style.css#L1-L150).

### Phase 2: Zero-Trust Client Encryption Vault (`docs/phases/phase-02-zero-trust-crypto/`)
- Implement PBKDF2 key derivation from user Master Password (`useAuth.js`) and AES-GCM vault encryption.
- Target files: [`src/composables/useAuth.js`](file:///G:/Projects/FinancialPlanner/src/composables/useAuth.js#L1-L60), [`src/services/cryptoService.js`](file:///G:/Projects/FinancialPlanner/src/services/cryptoService.js#L1-L75), [`src/services/indexedDbRepository.js`](file:///G:/Projects/FinancialPlanner/src/services/indexedDbRepository.js#L1-L150).

### Phase 3: Financial Simulators & Goal Calculators (`docs/phases/phase-03-simulators-and-calculators/`)
- Implement pure calculation services in `financialCalculations.js` and interactive UI components.
- Target files: [`src/services/financialCalculations.js`](file:///G:/Projects/FinancialPlanner/src/services/financialCalculations.js#L1-L120), [`src/components/GoalCalculator.vue`](file:///G:/Projects/FinancialPlanner/src/components/GoalCalculator.vue#L1-L200), [`src/components/PortfolioTracker.vue`](file:///G:/Projects/FinancialPlanner/src/components/PortfolioTracker.vue#L1-L220).

### Phase 4: Dynamic Life Investment Timeline (`docs/phases/phase-04-investment-timeline/`)
- Build interactive row-based net worth projection timeline (`InvestmentTimeline.vue`).
- Target files: [`src/components/InvestmentTimeline.vue`](file:///G:/Projects/FinancialPlanner/src/components/InvestmentTimeline.vue#L1-L180).

### Phase 5: i18n Localization & Vault Backup Automation (`docs/phases/phase-05-i18n-and-export/`)
- Implement reactive i18n hook (`useI18n.js`) with dual locale dictionaries (`en-US`, `pt-BR`) and encrypted vault backup export.
- Target files: [`src/composables/useI18n.js`](file:///G:/Projects/FinancialPlanner/src/composables/useI18n.js#L1-L89), [`src/components/OptionsModal.vue`](file:///G:/Projects/FinancialPlanner/src/components/OptionsModal.vue#L1-L100).

### Phase 6: Loan Tracker & Credit Installment Schedules (`docs/phases/phase-06-loan-tracker-and-schedules/`)
- Implement credit card limit installment scheduling (`generateCreditCardInstallments`) and casual friend loan metrics engine.
- Target files: [`src/services/loanCalculations.js`](file:///G:/Projects/FinancialPlanner/src/services/loanCalculations.js#L1-L120), [`src/components/LoanTracker.vue`](file:///G:/Projects/FinancialPlanner/src/components/LoanTracker.vue#L1-L250).

### Phase 7: Monthly Income Registration & Projections (`docs/phases/phase-07-monthly-income-tracker/`)
- Register income sources (salary, dividends, received payments), each optionally flagged as recurring; generate a month-by-month projection list (received vs. pending) with monthly totals, projectable up to 35 years.
- Target files: `src/services/incomeCalculations.js` (new), `src/components/IncomeTracker.vue` (new).

### Phase 8: Monthly Expense Registration & Projections (`docs/phases/phase-08-monthly-expense-tracker/`)
- Register expense sources (fixed bills, variable spending, subscriptions), each optionally flagged as recurring and optionally given an end date for bounded-term recurring sources; generate a month-by-month projection list (paid vs. pending) with monthly totals, projectable up to 35 years, mirroring the income tracker's data model.
- Target files: `src/services/expenseCalculations.js` (new), `src/components/ExpenseTracker.vue` (new).
