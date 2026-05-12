# Financial Planner Context

**Project Overview:**
Financial Planner is a Vue 3 Single Page Application (SPA) aimed at tracking, calculating, and simulating financial scenarios (investment goals, portfolio growth, life-long timelines).

**Tech Stack:**

- **Framework:** Vue 3 (Composition API with `<script setup>`)
- **Build Tool:** Vite
- **Testing:** Vitest
- **Styling:** Vanilla CSS (Modern dark theme; NO TailwindCSS unless specifically configured)
- **Database/Storage:** IndexedDB and LocalStorage for persistent state.

**Core Architecture & Directory Structure:**

- `src/components/`: Vue components (e.g., `PortfolioTracker.vue`, `PastInvestmentSimulator.vue`, `TimeGapComparator.vue`).
- `src/composables/`: Reusable Vue composition API hooks (state management, i18n, storage wrappers).
- `src/services/`: Core logic and utilities, specifically `financialCalculations.js` for heavy math and financial projections.
- `src/locales/`: Translation dictionaries for internationalization.
- `docs/`: Technical documentation and function breakdowns.

**Key Features:**

1. **Time Gap:** Compares chronologically offset investment scenarios.
2. **Past Simulator:** Simulates wealth growth based on consistent past investments.
3. **Goal Calculator:** Determines required deposits to reach a timeframe-based goal.
4. **Portfolio Tracker:** Manages active investments (profits, yields, growth rates).
5. **Life/Investment Timeline:** A dynamic, row-based interactive timeline projecting net worth across months and years.

**Important Development Guidelines:**

1. **Internationalization (i18n):**
   - The app uses a custom, lightweight, reactive i18n framework (not vue-i18n).
   - Supported locales: English (`en-US`), Portuguese (`pt-BR`).
   - Completely currency-agnostic: Supports switching between USD, BRL, etc.
   - **Rule:** Never hardcode user-facing strings or currencies. Always use dynamic translation dictionaries and format numbers through the i18n helpers.
2. **State & Persistence:**
   - Features rely on robust persistence across page refreshes.
   - Always ensure that user inputs, settings, locale configs, and portfolio data are persistently saved via the corresponding storage mechanisms (IndexedDB/LocalStorage).

3. **Styling (Vanilla CSS):**
   - Rely on Vanilla CSS defined in `src/style.css` or component-scoped styles.
   - Ensure you conform to the dark theme guidelines, maintaining a dynamic and visually pleasing design with interactive elements and high contrast.

4. **Security & Cryptography:**
   - Designed around a **Zero-Trust Client Architecture**.
   - Requires `window.crypto.subtle` for PBKDF2 and AES-GCM data encryption prior to storage in `IndexedDB`.
   - Never use `v-html` to render user data to prevent Cross-Site Scripting (XSS).
   - Component interactions requiring read/writes to DB must accommodate unlocking errors if the application enters a locked state (`useAuth.js`).

5. **Business Logic separation:**
   - Keep Vue components clean.
   - Offload heavy calculations, loops, or complex financial math to functions within `src/services/financialCalculations.js`.

**Workflow when adding a New Feature:**

1. **Create/Update Components:** Add UI elements adhering to the existing CSS theme.
2. **Handle State:** Ensure any new reactive data variables are persisted if they represent user configurations or saved financial info.
3. **i18n Integration:** Add required text labels to BOTH English and Portuguese dictionaries under `src/locales/`.
4. **Calculations:** Add pure mathematical logic to `src/services/` accompanied by necessary unit tests via Vitest.
