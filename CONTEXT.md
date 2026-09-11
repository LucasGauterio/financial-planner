# FinancialPlanner Context & Master Workflow Guide (`CONTEXT.md`)

This document is the authoritative single source of truth for **FinancialPlanner**. It defines project architecture, environment setup, Git conventions, documentation-first development rules, planning pipelines, execution guidelines, testing procedures, and available skills.

---

## 🏛 1. Project Overview & Architecture

- **Project Domain**: Single Page Application (SPA) for tracking, calculating, and simulating financial scenarios (Investment Timeline, Goal Calculator, Past Investment Simulator, Time Gap Comparator, Portfolio Tracker, Loan Tracker).
- **Framework / Runtime**: Vue 3 (Composition API with `<script setup>`)
- **Build Tool**: Vite
- **Testing Framework**: Vitest (`@vue/test-utils`, `jsdom`)
- **Styling / UI**: Vanilla CSS (modern dark theme in `src/style.css`, scoped component styles; **NO TailwindCSS**)
- **State & Storage**: IndexedDB + LocalStorage for client-side persistent storage
- **Cryptography**: Native Web Crypto API (`window.crypto.subtle`) for PBKDF2 key derivation and AES-GCM vault encryption
- **Localization (i18n)**: Custom reactive i18n hook (`useI18n.js`), supporting `en-US` and `pt-BR`. Currency agnostic.

### Directory Tree
```
FinancialPlanner/
├── src/
│   ├── components/      # Vue 3 UI components (PortfolioTracker.vue, LoanTracker.vue, etc.)
│   ├── composables/     # Vue hooks (useAuth.js, useI18n.js, useStorage.js)
│   ├── services/        # Core business logic & math (financialCalculations.js, loanCalculations.js)
│   ├── locales/         # Translation dictionaries (en-US.js, pt-BR.js)
│   └── style.css        # Core design system tokens & dark theme
├── docs/                # Greenfield plans, phase docs (phase-01 to phase-06), PRD, RFC, FDD, ADRs, TRACKER
│   ├── project-plan.md   # Master Greenfield roadmap & phase list
│   ├── PRD.md            # Product Requirements Document
│   ├── RFC.md            # Technical Architecture & Trade-offs
│   ├── FDD.md            # Functional Design Document + Embedded Mermaid Diagrams
│   ├── TRACKER.md        # Line-level Traceability Matrix (file.ext#Lnn-Lmm)
│   ├── phases/           # Phased implementation plan documents (phase-01 to phase-06)
│   └── adrs/             # Architecture Decision Records (ADR-001..004)
├── AGENTS.md             # Universal agent entrypoint (points to CONTEXT.md)
├── CLAUDE.md             # Claude Code CLI entrypoint (points to CONTEXT.md)
├── CONTEXT.md            # Authoritative Single Source of Truth
├── .agents/              # AI agent rules & workflow skills (agent-invocation ready)
└── .claude/              # Native Claude Code CLI skills, commands, rules, agents, and references
```

### Key Feature Modules
1. **Time Gap**: Compares chronologically offset investment scenarios (`TimeGapComparator.vue`).
2. **Past Simulator**: Simulates wealth growth based on consistent past investments (`PastInvestmentSimulator.vue`).
3. **Goal Calculator**: Determines required deposits to reach a timeframe-based goal (`GoalCalculator.vue`).
4. **Portfolio Tracker**: Manages active investments, profits, yields, and growth rates (`PortfolioTracker.vue`).
5. **Loan Tracker**: Manages casual friend loans and credit card limit installment schedules (`LoanTracker.vue`, `loanCalculations.js`).
6. **Life/Investment Timeline**: Dynamic row-based interactive timeline projecting net worth across months and years (`InvestmentTimeline.vue`).

---

## 🛠 2. Environment Setup & Execution Commands

- **Start Dev Server**: `npm run dev` *(Run ONLY when explicitly asked by user; starts Vite at http://localhost:5173)*
- **Production Build**: `npm run build` *(Builds production bundle into dist/)*
- **Preview Build**: `npm run preview`
- **Run Unit Tests**: `npx vitest run` or `npm run test`
- **Run Single Test File**: `npx vitest run src/services/loanCalculations.test.js`

---

## 📐 3. Documentation-First Development Policy

> **CRITICAL RULE**: **Development ALWAYS starts from documentation.**

When a user requests a new feature, bugfix, or architectural refactoring:
1. **NEVER modify source code directly** as a first step.
2. **Scan Existing Documentation**: Read `docs/PRD.md`, `docs/RFC.md`, `docs/FDD.md`, `docs/TRACKER.md`, and `docs/project-plan.md`.
3. **Update / Create Documentation**:
   - Use `/design-docs-prd`, `/design-docs-rfc`, and `/design-docs-fdd` to update core technical specs.
   - Update `docs/project-plan.md` and add/update phase plans under `docs/phases/phase-NN-*/phase-NN-*.md`.
   - Ensure all step implementations (SIs) and requirements include **explicit line-anchored file links** (`file.ext#Lnn-Lmm`).
4. **Obtain Alignment**: Confirm plan and documentation updates before starting code implementation.

---

## 📋 4. Feature Planning & Slicing Workflow

1. **Architectural Specification (`/plan-build`)**:
   - Generate technical specifications using templates (`api-contracts`, `data-model`, `error-catalog`, `frontend-runtime`, `traceability-matrix`, `ui-contracts`).
2. **Phase Plan Slicing (`/plan-pipeline`)**:
   - Slicing orchestrator breaking feature scope into atomic, verifiable Step Implementations (SIs).
   - Document dependency maps, prerequisites, and explicit line anchors in `docs/phases/`.

---

## 💻 5. Development & Code Execution Workflow

1. **Step Implementation (`/implement` & `/implement-phase`)**:
   - Execute SIs sequentially as specified in the phase plan.
   - Maintain strict **Separation of Concerns**: offload heavy financial calculations, compound interest formulas, and loan schedules to pure JS functions in `src/services/financialCalculations.js` and `src/services/loanCalculations.js`.
2. **Zero-Trust Security & Encryption**:
   - Data stored in IndexedDB/LocalStorage MUST be encrypted via `AES-GCM` using the user's Master Password key (`useAuth.js`, `cryptoService.js`).
   - NEVER use `v-html` to render user inputs (prevents XSS).
3. **Strict Bi-Lingual i18n**:
   - User-facing text must NEVER be hardcoded.
   - All text keys MUST exist in BOTH `src/locales/en-US.js` and `src/locales/pt-BR.js`.

---

## 🧪 6. Testing, Validation & Delivery Gate

1. **Unit Testing**:
   - Every function added to `src/services/` MUST have a corresponding Vitest unit test file.
   - Execute `npx vitest run` and verify **100% of unit tests pass** (currently 33/33 tests passing).
2. **Traceability Matrix (`TRACKER.md`)**:
   - Update `docs/TRACKER.md` to map new/modified requirements directly to code lines (`file.ext#Lnn-Lmm`).
3. **Validation Report (`/design-docs-validate`)**:
   - Run validation skills to confirm document consistency, link integrity, and test coverage before marking delivery complete.

---

## 🌿 7. Git & Branching Conventions

- **Branch Strategy (GitFlow)**:
  - `main`: Stable production branch.
  - `dev`: Integration branch for current development sprint.
  - `feature/<feature-name>`: Feature development branches cut from `dev`.
  - `bugfix/<bug-description>`: Fix branches cut from `dev`.
- **Commit Format (Conventional Commits)**:
  - `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.
- **Gitleaks Compliance**: Never commit secrets or high-entropy key strings.

---

## 🧰 8. Available Workflows & Skills Index

### Reverse-Engineering & Documentation Workflow (`.claude/skills/` & `.agents/skills/`)
- `design-docs-baseline`: Generates initial baseline context and codebase maps.
- `design-docs-prd`: Authors/updates Product Requirements Document (`docs/PRD.md`).
- `design-docs-rfc`: Technical proposal & architectural trade-offs (`docs/RFC.md`).
- `design-docs-fdd`: Functional design spec with Mermaid diagrams (`docs/FDD.md`).
- `design-docs-adr`: Architecture Decision Records (`docs/adrs/`).
- `design-docs-tracker`: Line-anchored traceability matrix (`docs/TRACKER.md`).
- `design-docs-validate`: Mechanical documentation validator.

### Greenfield Planning & Execution Workflow
- `plan-pipeline`: Master implementation plan slicing orchestrator.
- `plan-build`: Tech spec and SI plan generator.
- `implement` / `implement-phase`: Step-by-step SI code implementation engine.
- `refactor-arch`: Architectural refactoring suite for legacy codebases.
