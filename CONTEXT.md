# FinancialPlanner Context & Master Workflow Guide (`CONTEXT.md`)

This document is the authoritative single source of truth for **FinancialPlanner**. It defines project architecture, environment setup, Git conventions, documentation-first development rules, planning pipelines, execution guidelines, testing procedures, and available skills.

---

## 🏛 1. Project Overview & Architecture

- **Project Domain**: Vue 3 SPA for tracking, calculating, and simulating financial scenarios (Investment Timeline, Goal Calculator, Past Investment Simulator, Time Gap Comparator, Portfolio Tracker, Loan Tracker).
- **Framework / Runtime**: Vue 3 (Composition API with <script setup>)
- **Build Tool**: Vite
- **Testing Framework**: Vitest (@vue/test-utils, jsdom)
- **Styling / UI**: Vanilla CSS (modern dark theme in src/style.css; NO TailwindCSS)
- **State & Storage**: IndexedDB + LocalStorage (AES-GCM encryption)
- **Database / Backend**: Client-side Web Crypto API

### Directory Tree
```
FinancialPlanner/
├── src/          # Application source code
├── docs/                 # System documentation & Greenfield roadmap
│   ├── project-plan.md   # Master Greenfield roadmap & phase list
│   ├── PRD.md            # Product Requirements Document
│   ├── RFC.md            # Technical Architecture & Trade-offs
│   ├── FDD.md            # Functional Design Document + Embedded Diagrams
│   ├── TRACKER.md        # Line-level Traceability Matrix (file.ext#Lnn-Lmm)
│   ├── phases/           # Phased implementation plans (each dir contains CONTEXT.md, validation.md, library-refs.md, phase-NN-{slug}.md)
│   └── adrs/             # Architecture Decision Records (ADR-001..NNN)
├── AGENTS.md             # Universal agent entrypoint (points to CONTEXT.md)
├── CLAUDE.md             # Claude Code CLI entrypoint (points to CONTEXT.md)
├── CONTEXT.md            # Authoritative Single Source of Truth
├── .agents/              # AI agent rules & workflow skills (agent-invocation ready)
└── .claude/              # Native Claude Code CLI skills, commands, rules, agents, and references
```

---

## 🛠 2. Environment Setup & Execution Commands

- **Start Dev Server**: `npm run dev` *(Only when user explicitly requests running the server)*
- **Production Build**: `npm run build`
- **Run Unit Tests**: `npx vitest run`
- **Run Single Test**: `npx vitest run src/services/financialCalculations.test.js`
- **Lint / Code Format**: `npm run lint`

---

## 📐 3. Documentation-First Development Policy

> **CRITICAL RULE**: **Development ALWAYS starts from documentation.**

When a user requests a new feature, bugfix, or architectural refactoring:
1. **NEVER modify source code directly** as a first step.
2. **Scan Existing System Documentation**: Read `docs/PRD.md`, `docs/RFC.md`, `docs/FDD.md`, `docs/TRACKER.md`, and `docs/project-plan.md`.
3. **Execute Unified New Feature Workflow**: Follow the 9-step **New Feature & Phase Slicing Workflow** detailed in Section 4 below.
4. **NO-SKIP WORKFLOW MANDATE**: AI Agents are strictly forbidden from skipping any `design-docs-*` skill (`/design-docs-prd`, `/design-docs-rfc`, `/design-docs-fdd`, `/design-docs-adr`, `/design-docs-tracker`, `/design-docs-validate`) or any pipeline stage (`/plan-context`, `/plan-validate`, `/plan-resolve`, `/plan-build`). Excuses such as "template doesn't fit the stack" or "no new architectural decision" are **STRICTLY INVALID**. All skills adapt dynamically to the target repository's stack (SPAs, client-side encryption, Vue, React, NestJS, Go, etc.). If a phase introduces no new architectural pattern, `/design-docs-adr` MUST still be executed to document pattern evaluation and explicit pattern reuse (`ADR-001`, `ADR-002`).
5. **Obtain Alignment**: Confirm system documentation and phase plan updates before starting code implementation.

---

## 📋 4. Feature Planning & New Phase Workflow

When a user requests a new feature or a new implementation phase (e.g. Phase 07), execute the following end-to-end 9-step workflow:

1. **Amend Master Greenfield Roadmap (`docs/project-plan.md`)**:
   - Add a `### Phase NN: <name>` section to `docs/project-plan.md` detailing capability bullets, target file links (`file.ext#Lnn-Lmm`), and subprojects. This is the authoritative source of truth for phase capability discovery.
2. **Discover Technical Decisions (`/research phase NN`)**:
   - Run `/research phase NN` to generate `docs/decisions/technical-decisions-{slug}.md`.
3. **AUTOMATIC SYSTEM DESIGN-DOCS ACTIVATION (`design-docs`) [MANDATORY & AUTOMATIC]**:
   - Immediately after technical decisions are made, AUTOMATICALLY activate system design-docs skills: `/design-docs-prd` (`docs/PRD.md`), `/design-docs-rfc` (`docs/RFC.md`), `/design-docs-fdd` (`docs/FDD.md`), and `/design-docs-adr` (`docs/adrs/`). **DO NOT ask the user if they want to update documentation — design-docs activation is MANDATORY and AUTOMATIC before implementation.**
4. **Consolidate Phase Context (`/plan-context NN`)**:
   - Run `/plan-context NN` (or slug) AFTER design-docs are updated to consolidate `project-plan.md` + technical decisions + system design docs into `docs/phases/phase-NN-{slug}/CONTEXT.md`.
5. **Validate Architectural Consistency (`/plan-validate NN`)**:
   - Run `/plan-validate NN` to verify consistency and produce `docs/phases/phase-NN-{slug}/validation.md` with status `clean` or `dirty`.
6. **Resolve Open Issues (`/plan-resolve NN`)**:
   - If validation is `dirty`, run `/plan-resolve NN` to answer open questions and update decisions docs until status is `clean`. Re-run `/plan-validate NN`.
7. **Emit Implementation Plan & Specs (`/plan-build NN` & `/plan-test-specs NN`)**:
   - Run `/plan-build NN` to emit `docs/phases/phase-NN-{slug}/phase-NN-{slug}.md` containing atomic Step Implementations (SIs), Dependency Map, and Deliverables.
   - Run `/plan-test-specs NN` (optional) if SIs include UI/controller test scenario placeholders.
8. **Execute Sequential Code Implementation (`/implement phase NN`)**:
   - Run `/implement phase NN` (or `/implement-phase`) to execute SIs sequentially with strict separation of concerns (UI components decoupled from pure service logic).
9. **Verify Quality Gate & Update Traceability Matrix (`vitest` + `TRACKER.md` + `design-docs-validate`)**:
   - Execute the unit test runner (`npx vitest run`) to ensure 100% test pass rate.
   - Run `/design-docs-tracker` to update `docs/TRACKER.md` with line-anchored file links (`file.ext#Lnn-Lmm`) mapping requirements to code lines.
   - Run `/design-docs-validate` to confirm complete document consistency and link integrity.

---

## 💻 5. Development & Code Execution Workflow

1. **Step Implementation (`/implement` & `/implement-phase`)**:
   - **Autonomous Continuous Mode Default**: Execute all SIs and phase transitions sequentially and automatically without pausing for user confirmation or asking "should I continue?". Interactive step-by-step review is OPT-IN ONLY when explicitly requested by the user ("modo interativo"). Prompt the user ONLY when unresolvable blockers or explicit decisions occur.
   - Maintain clean **Separation of Concerns**: offload calculation, business logic, and data storage to pure service modules in `src/services`.
2. **Zero-Trust Security**:
   - Never write raw API keys or passwords in source code.
   - Sanitize all user inputs to prevent XSS vulnerabilities (`v-html` prohibited).
3. **Strict Internationalization (i18n)**:
   - User-facing text must be externalized in locale dictionaries.

---

## 🧪 6. Testing, Validation & Delivery Gate

1. **Unit Testing**:
   - Every function added to service modules MUST have an accompanying unit test file.
   - Execute `npx vitest run` and ensure **100% of tests pass**.
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
