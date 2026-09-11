# FinancialPlanner — Greenfield Project Plan

## Executive Summary & Overview

FinancialPlanner is a Vue 3 Single Page Application (SPA) designed for tracking, calculating, and simulating financial growth, investment goals, portfolio yields, and life-long net worth timelines.

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
- Implement composables for state storage (`useStorage.js`) and reactive state binding.

### Phase 2: Zero-Trust Client Encryption Vault (`docs/phases/phase-02-zero-trust-crypto/`)
- Implement PBKDF2 key derivation from user Master Password (`useAuth.js`).
- Integrate Web Crypto API (`AES-GCM`) encryption layer before writing ciphertext to IndexedDB.

### Phase 3: Financial Simulators & Calculators Engine (`docs/phases/phase-03-simulators-and-calculators/`)
- Implement pure calculation services in `src/services/financialCalculations.js` and `loanCalculations.js`.
- Build UI components: `GoalCalculator.vue`, `PastInvestmentSimulator.vue`, `TimeGapComparator.vue`.
- Scaffold Vitest unit tests for 100% calculation coverage.

### Phase 4: Dynamic Life Investment Timeline (`docs/phases/phase-04-investment-timeline/`)
- Build interactive row-based net worth projection timeline (`InvestmentTimeline.vue`).
- Sync balances across portfolio items, yields, and chronological monthly offsets.

### Phase 5: i18n Localization & Vault Backup Automation (`docs/phases/phase-05-i18n-and-export/`)
- Implement reactive i18n hook (`useI18n.js`) with dual locale dictionaries (`en-US`, `pt-BR`).
- Implement encrypted `.json` backup export and import functionality.
