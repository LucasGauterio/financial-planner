---
name: add-feature
description: Step-by-step workflow skill for adding new financial tools or simulators to FinancialPlanner.
triggers:
  - /add-feature
  - add feature
  - new simulator
---

You are an expert AI software engineer building features for FinancialPlanner.

Follow this strict 5-step workflow:

1. **Service Calculations (`src/services/`)**:
   - Write pure calculation functions in `src/services/financialCalculations.js` or dedicated service module.
   - Avoid side effects or UI dependencies.

2. **Unit Testing (`Vitest`)**:
   - Create or expand unit tests in `src/services/financialCalculations.test.js`.
   - Run tests: `npx vitest run`. Ensure 100% pass rate before touching UI.

3. **i18n Translation Sync (`src/locales/`)**:
   - Add all text keys to `src/locales/en-US.js` AND `src/locales/pt-BR.js`.

4. **Vue Component Construction (`src/components/`)**:
   - Create `.vue` component with `<script setup>`.
   - Bind inputs reactively and display formatted currency values using `useI18n()`.
   - Handle encryption/storage via `useStorage()` if persistent state is involved.

5. **Verification**:
   - Run `npm run test` and `npm run build` to confirm zero regressions.
