# AGENTS.md

This document provides instructions for AI Agents (Antigravity, Claude Code, Cursor, Codex, Windsurf) working in the **FinancialPlanner** repository.

---

## 🚀 Quick Reference & Commands

- **Dev Server**: `npm run dev` (starts Vite dev server at `http://localhost:5173`)
- **Build**: `npm run build` (builds production bundle via Vite into `dist/`)
- **Preview**: `npm run preview`
- **Tests**: `npm run test` (runs Vitest unit tests)
- **Single Test**: `npx vitest run src/services/financialCalculations.test.js`

---

## 🛠 Project Architecture & Tech Stack

- **Framework**: Vue 3 (Composition API with `<script setup>`)
- **Build Tool**: Vite
- **Testing**: Vitest (`@vue/test-utils`, `jsdom`)
- **Styling**: Vanilla CSS (modern dark theme defined in `src/style.css`, scoped CSS in components; **NO TailwindCSS**)
- **State & Storage**: IndexedDB + LocalStorage for client-side persistent storage
- **Cryptography**: Native Web Crypto API (`window.crypto.subtle`) for PBKDF2 key derivation and AES-GCM vault encryption.
- **Localization (i18n)**: Custom reactive i18n hook (`useI18n.js`), supporting `en-US` and `pt-BR`. Currency agnostic.

---

## 📂 Key Directory Structure

```
FinancialPlanner/
├── src/
│   ├── components/      # Vue 3 UI components (PortfolioTracker.vue, etc.)
│   ├── composables/     # Vue hooks (useAuth.js, useI18n.js, useStorage.js)
│   ├── services/        # Core business logic & math (financialCalculations.js)
│   ├── locales/         # Translation dictionaries (en-US.js, pt-BR.js)
│   └── style.css        # Core design system tokens & dark theme
├── docs/                # Feature & function documentation
├── .agents/             # AI agent rules & skills
│   ├── rules/           # Scoped guardrails (security, i18n, vue-composition)
│   └── skills/          # Custom workflow skills
└── .claude/             # Claude Code CLI native configurations
```

---

## ⚠️ Mandatory Agent Guidelines

1. **Zero-Trust Security & Encryption**:
   - Data stored in IndexedDB/LocalStorage MUST be encrypted via `AES-GCM` using the user's Master Password key.
   - NEVER use `v-html` to render user inputs (prevents XSS).
   - Component state reads/writes must handle vault lock/unlock lifecycle safely (`useAuth.js`).

2. **Business Logic Separation**:
   - Keep Vue components clean. Offload heavy calculations, compound interest formulas, and financial projections to pure JS functions in `src/services/financialCalculations.js`.
   - Every function in `src/services/` MUST have a corresponding Vitest unit test.

3. **Strict Bi-Lingual i18n**:
   - User-facing text must NEVER be hardcoded.
   - All text keys MUST exist in BOTH `src/locales/en-US.js` and `src/locales/pt-BR.js`.
   - Format numbers, yields, and balances dynamically using `formatCurrency` or locale helpers.

4. **Verification Loop**:
   - Always verify changes by running `npm run test` before completing a task.
   - Build bundle with `npm run build` if changing Vite configurations or core dependencies.
