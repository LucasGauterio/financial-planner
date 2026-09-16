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
- Register income sources (salary, dividends, received payments), each optionally flagged as recurring; generate a month-by-month projection list (received vs. pending) with monthly totals, projectable up to 35 years. Registered sources can be edited (reopens the registration form pre-filled) or deleted (behind a confirmation step), matching the edit/delete flow established by the Loan Tracker.
- **Addendum** (2026-09-15): recurring income sources can optionally be given an end date, so a recurring income source stops projecting after a given month instead of continuing indefinitely — mirroring the `endMonth` capability already available for recurring expense sources (Phase 8).
- Target files: `src/services/incomeCalculations.js` (new), `src/components/IncomeTracker.vue` (new).

### Phase 8: Monthly Expense Registration & Projections (`docs/phases/phase-08-monthly-expense-tracker/`)
- Register expense sources (fixed bills, variable spending, subscriptions), each optionally flagged as recurring and optionally given an end date for bounded-term recurring sources; generate a month-by-month projection list (paid vs. pending) with monthly totals, projectable up to 35 years, mirroring the income tracker's data model. Registered sources can be edited (reopens the registration form pre-filled) or deleted (behind a confirmation step), matching the edit/delete flow established by the Loan Tracker.
- Target files: `src/services/expenseCalculations.js` (new), `src/components/ExpenseTracker.vue` (new).

### Phase 9: Editable Actual Amounts & Consolidated Cash Flow Overview (`docs/phases/phase-09-cash-flow-overview/`)
- Extend the Income and Expense trackers' projection entries so that, once an entry is marked Received/Paid, an editable "actual amount" field appears for that entry (defaulting to the expected/registered amount), mirroring the Investment Timeline's mark-as-Done editable `actualValue` pattern. The edited amount persists per entry and feeds the monthly totals in place of the expected amount.
- Add a new consolidated Cash Flow Overview screen presenting Income and Expense projections together in a single month-by-month list, showing each entry's Pending/Paid/Received status and actual amount where applicable, plus monthly aggregate totals for Pending, Paid, and Received across both income and expenses.
- Target files: [`src/components/InvestmentTimeline.vue`](file:///G:/Projects/FinancialPlanner/src/components/InvestmentTimeline.vue#L1-L260) (reference pattern), `src/components/IncomeTracker.vue`, `src/components/ExpenseTracker.vue`, `src/services/incomeCalculations.js`, `src/services/expenseCalculations.js`, `src/components/CashFlowOverview.vue` (new), `src/services/cashFlowCalculations.js` (new), `src/App.vue` (new tab).

### Phase 10: Income/Expense Tracker Card & Drawer Restyle (`docs/phases/phase-10-income-expense-card-restyle/`)
- Restyle `IncomeTracker.vue` and `ExpenseTracker.vue` to visually and structurally match `LoanTracker.vue`: a stats dashboard row (e.g. total registered / received-or-paid / pending across the selected horizon), registered sources rendered as a card grid (hover-revealed edit/delete action icons instead of always-visible ones), and a per-source detail drawer (slide-in panel, opened by clicking a card) that shows that source's own month-by-month projection list — with the existing status-toggle and actual-amount editing controls — replacing today's single combined projection list rendered inline below the source list.
- The Cash Flow Overview screen (Phase 9) is explicitly out of scope for this restyle and keeps its current combined list-based layout.
- **Addendum** (2026-09-15): the Projection Horizon control in both trackers is restyled from a discrete `<select>` dropdown to a continuous ruler-slider input, matching `PortfolioTracker.vue`'s existing horizon slider (`input[type="range"]` + tick marks + a pill badge showing the selected year count and resulting calendar year).
- Target files: [`src/components/LoanTracker.vue`](file:///G:/Projects/FinancialPlanner/src/components/LoanTracker.vue#L1-L1681) (reference pattern), [`src/components/PortfolioTracker.vue`](file:///G:/Projects/FinancialPlanner/src/components/PortfolioTracker.vue#L1-L40) (horizon slider reference pattern), `src/components/IncomeTracker.vue`, `src/components/ExpenseTracker.vue`.

### Phase 11: Full Dependency & Runtime Upgrade (`docs/phases/phase-11-dependency-upgrade/`)
- Upgrade every project dependency, library, and framework to its latest compatible release: `vue` (3.5.x line), `vite`, `@vitejs/plugin-vue`, `vitest`, `@vitest/coverage-v8` (major bump 4→5), `jsdom` (major bump 29→30), and `@vue/test-utils` patch/minor line, plus the Node.js runtime the project builds and deploys against (Dockerfile's `node:20-alpine` base image and a new `engines` field in `package.json`), moving to Node 24 (the current Active/Maintenance LTS line), which vitest 5 and jsdom 30 both require.
- No user-facing behavior changes — a maintenance/security-hygiene phase. Existing test suite (100% pass rate required) is the acceptance gate; any breaking change surfaced by a major-version bump must be fixed in this phase, not deferred.
- Target files: `package.json`, `package-lock.json`, `Dockerfile`, `vite.config.js` (if any Vitest 5 config-shape changes are required).

### Phase 12: Spreadsheet Data Export (`docs/phases/phase-12-spreadsheet-export/`)
- Add a data-export capability that consolidates every tracked domain — Income sources & projections, Expense sources & projections, Loan Tracker entries & schedules, Portfolio Tracker holdings, Cash Flow Overview, and Investment Timeline entries — into a downloadable spreadsheet file, one sheet/tab per domain, exposed via a new dedicated Data Export screen.
- Target files: [`src/components/BackupManager.vue`](../src/components/BackupManager.vue#L1-L100) (reference existing export screen pattern), `src/components/DataExport.vue` (new), `src/services/spreadsheetExportService.js` (new), `src/App.vue` (new nav entry).
