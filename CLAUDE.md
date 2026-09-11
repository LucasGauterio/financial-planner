# AGENTS.md / CLAUDE.md — FinancialPlanner

This document serves as the root entrypoint for AI Agents (Claude Code, Antigravity, Cursor, Codex, Windsurf) working in **FinancialPlanner**.

> 📖 **Single Source of Truth Notice**:
> To eliminate duplication across configuration files, authoritative repository context, workflows, environment setup, Git conventions, documentation-first policies, and validation procedures are maintained in [`CONTEXT.md`](CONTEXT.md).
> All AI Agents MUST read [`CONTEXT.md`](CONTEXT.md) at the start of a session or when planning tasks.

---

## 🚀 Quick Reference & Commands

- **Dev Server**: `npm run dev` (run ONLY when explicitly requested by user)
- **Build**: `npm run build`
- **Tests**: `npx vitest run`
- **Single Test**: `npx vitest run src/services/financialCalculations.test.js`
- **Lint / Format**: `npm run lint`

---

## ⚡ Core Directives

1. **Consult `CONTEXT.md`**: Refer to [`CONTEXT.md`](CONTEXT.md) for full project architecture, GitFlow conventions, testing rules, and skills index.
2. **Documentation-First Policy & Absolute No-Skip Guarantee**: ALL feature additions or new phases MUST start by updating documentation in `docs/`. After `/research phase NN` completes, AUTOMATICALLY activate system design-docs skills (`/design-docs-prd`, `/design-docs-rfc`, `/design-docs-fdd`, `/design-docs-adr`). Agents are STRICTLY FORBIDDEN from skipping any `design-docs-*` skill or pipeline stage under any pretext (excuses like 'template doesn't fit' or 'no new ADR needed' are invalid — skills adapt dynamically to the stack).
3. **Workspace Boundary (`restricao_escopo`)**: Restrict all read, edit, and execution operations strictly to `FinancialPlanner`.
4. **Autonomous Execution Default**: Execute all workflow stages, phase transitions, and SIs continuously without pausing for user confirmation or asking 'should I proceed?'. Interactive review is OPT-IN ONLY when the user explicitly requests manual control ('modo interativo'). Stop ONLY for unresolvable blockers or explicit user-only decisions.
5. **Quality Gate**: Run `npx vitest run` and verify 100% test pass rate before declaring any task complete.
