# phase-11-dependency-upgrade — Context

## Scope

**Phase name:** Full Dependency & Runtime Upgrade

**Capabilities** (literal, `docs/project-plan.md`):

- Upgrade every project dependency, library, and framework to its latest compatible release: `vue`, `vite`, `@vitejs/plugin-vue`, `vitest`, `@vitest/coverage-v8` (major 4→5), `jsdom` (major 29→30), and `@vue/test-utils`'s patch/minor line, plus the Node.js runtime (`Dockerfile`'s base image and a new `engines` field), moving to Node 24.
- No user-facing behavior change — a maintenance/security-hygiene phase. The existing test suite (100% pass rate) is the acceptance gate.

**Out of scope:** Vue 3.6 (only `beta`/`rc` at decision time) and `@vue/test-utils@2.5.0` (would reintroduce a Node-engine constraint via `js-beautify@2.x`'s `nopt@10` dependency) — see `docs/PRD.md` § Out of Scope / Deferred Items and [ADR-016](../../adrs/ADR-016-full-dependency-and-runtime-upgrade.md).
**Deliverables:** Target files: `package.json`, `package-lock.json`, `Dockerfile`, `vite.config.js` (only if a Vitest 5 breaking change requires it).
**Affected subprojects:** _None explicitly mentioned — single-repo Vue 3 SPA (no subproject split exists in this project)._
**Deferred subprojects:** _None._
**Sequencing notes:** Phase 11 touches the build/test toolchain every prior phase's code runs on, but changes no application code. It has no dependents queued behind it.

**Neighbors (for boundary detection only):**

- **Phase 10:** Income/Expense Tracker Card & Drawer Restyle — the last application-feature phase; Phase 11 does not touch its deliverables.
- **Phase 12:** _No phase 12 defined — Phase 11 is the last phase in `docs/project-plan.md`._

## Decisions Index

_No phase-scope decisions document — see [ADR-016](../../adrs/ADR-016-full-dependency-and-runtime-upgrade.md) for the two genuinely open trade-offs (whether to bump `@vue/test-utils` to `2.5.0`, and whether to adopt Vue 3.6), both resolved directly in the ADR rather than a decisions document, matching the pattern used for Phase 10's pattern-reuse ADR._

## Capability Coverage

| Capability (from project-plan.md) | Covered by |
|-----------------------------------|------------|
| Full dependency + Node runtime upgrade | [ADR-016](../../adrs/ADR-016-full-dependency-and-runtime-upgrade.md) |

## Inherited Conventions

- `npx vitest run` must show 100% pass rate before any phase is declared complete (project-wide rule, `CLAUDE.md`).
- Documentation-first: every phase requires ADR/RFC/FDD/PRD/TRACKER coverage before or alongside implementation — this phase is itself an application of that rule to a non-feature (infrastructure) change.

## Testing Requirements

### src (single Vue 3 SPA)

_No application code changes are expected; the acceptance gate is the existing test suite passing unmodified against the upgraded toolchain (`npx vitest run`), plus `npm run build` succeeding and `npm install` producing zero deprecation/engine warnings._
