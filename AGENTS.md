# AGENTS.md / CLAUDE.md — FinancialPlanner

This document serves as the root entrypoint for AI Agents (Claude Code, Antigravity, Cursor, Codex, Windsurf) working in **FinancialPlanner**.

> 📖 **Single Source of Truth Notice**:
> To eliminate duplication across configuration files, authoritative repository context, workflows, environment setup, Git conventions, documentation-first policies, and validation procedures are maintained in [`CONTEXT.md`](CONTEXT.md).
> All AI Agents MUST read [`CONTEXT.md`](CONTEXT.md) at the start of a session or when planning tasks.

---

## 🚀 Quick Reference & Commands

- **Dev Server**: `npm run dev` (run ONLY when explicitly requested by user; starts Vite at `http://localhost:5173`)
- **Build**: `npm run build` (builds production bundle via Vite into `dist/`)
- **Preview**: `npm run preview`
- **Run Tests**: `npx vitest run` or `npm run test`
- **Single Test**: `npx vitest run src/services/financialCalculations.test.js`

---

## ⚡ Core Directives

1. **Consult `CONTEXT.md`**: Refer to [`CONTEXT.md`](CONTEXT.md) for full project architecture, GitFlow conventions, testing rules, and skills index.
2. **Documentation-First Policy**: ALL feature additions, bugfixes, or architectural changes MUST start by updating/scaffolding documentation in `docs/` via available workflows before modifying source code.
3. **Workspace Boundary (`restricao_escopo`)**: Restrict all read, edit, and execution operations strictly to `FinancialPlanner`.
4. **Quality Gate**: Run `npx vitest run` and verify 100% test pass rate before declaring any task complete.
