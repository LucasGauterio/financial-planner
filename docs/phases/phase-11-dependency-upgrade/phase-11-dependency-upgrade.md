# Phase 11: Full Dependency & Runtime Upgrade

## Objective
Upgrade every project dependency, library, and framework to its latest compatible release — including the Node.js runtime the project builds and deploys against — with zero user-facing behavior change and zero regression in the existing test suite (100% pass rate required). This is a maintenance/security-hygiene phase, not a feature phase.

## Technical Decisions
No technical-decisions document was produced for this phase — there is no competing-alternatives decision about *what to build*, only a dependency-currency exercise with two genuinely open trade-offs (whether to bump `@vue/test-utils` to `2.5.0`, and whether to adopt Vue 3.6), both resolved directly in [ADR-016](../../adrs/ADR-016-full-dependency-and-runtime-upgrade.md):

- **Bump within current major** (no alternatives considered — always correct): `vue` 3.5.32 → 3.5.42, `@vitejs/plugin-vue` 6.0.6 → 6.0.9, `vite` 8.0.8 → 8.3.0.
- **Bump across major** (`vitest`/`@vitest/coverage-v8` 4→5, `jsdom` 29→30): both require Node ≥22.12/22.22 respectively, which the project's Node 24 upgrade satisfies.
- **Node runtime**: `Dockerfile`'s `node:20-alpine` → `node:24-alpine` (current Active/Maintenance LTS), plus a new `package.json` `"engines"` field.
- **`@vue/test-utils` deliberately NOT bumped past `^2.4.6`** — bumping to `2.5.0` would pull `js-beautify@2.x` → `nopt@10`, whose Node-engine requirement the Node 24 *deploy* upgrade cannot guarantee on an arbitrary developer's *local* machine. The existing `glob` override (BUGFIX-004) is kept instead.
- **Vue 3.6 NOT adopted** — only available as `beta`/`rc` at decision time; out of scope for a routine maintenance upgrade of a production financial app.

## Dependency Map
- Touches every phase indirectly (it's the build/test toolchain every other phase's code runs on), but changes no application code — `src/**` is untouched except where a major-version bump surfaces an actual breaking change (verified via the full test suite, none found).
- Depends on nothing; blocks nothing (no other phase is queued behind this one).

## Step Implementations (SIs)

### SI-11.1: Patch/Minor Bumps Within Current Major
- Bump `vue`, `@vitejs/plugin-vue`, `vite` to latest within their already-current major via `package.json` version ranges + `npm install`.
- Target files: `package.json`, `package-lock.json`.
- Tests: `npx vitest run` (full suite, no config changes expected to be needed).

### SI-11.2: Node Runtime Upgrade (Node 20 → 24)
- `Dockerfile`: `FROM node:20-alpine AS builder` → `FROM node:24-alpine AS builder`.
- `package.json`: add `"engines": { "node": ">=24" }`.
- Target files: `Dockerfile`, `package.json`.
- Tests: `npm run build` (confirms the build toolchain itself still works; the actual Docker image is not built in this environment, but `vite build`'s Node-version-sensitive behavior, if any, is exercised locally).

### SI-11.3: Vitest 4 → 5 and `@vitest/coverage-v8` 4 → 5 (major)
- Bump both in lockstep (peer-locked). Verify `vite.config.js`'s `test` block against the Vitest 5 migration guide; fix any breaking change surfaced by the full test run.
- Target files: `package.json`, `package-lock.json`, `vite.config.js` (only if a breaking change requires it).
- Tests: `npx vitest run` (full suite; this SI's actual acceptance gate — any failure here must be diagnosed and fixed, not deferred).

### SI-11.4: jsdom 29 → 30 (major)
- Bump directly; verify no jsdom-API-surface regression via the full test suite (jsdom is only exercised indirectly, through `@vue/test-utils`'s DOM interactions).
- Target files: `package.json`, `package-lock.json`.
- Tests: `npx vitest run` (full suite).

### SI-11.5: Full-Suite Regression & Deploy-Warning Verification
- Run `npm install` fresh and confirm zero deprecation/engine warnings; run `npx vitest run` and `npm run build` one final time against the fully-upgraded lockfile.
- Target files: none (verification only).
- Tests: `npx vitest run`, `npm run build`.

## Deliverables
- Every dependency at its latest compatible release except the one documented exception (`@vue/test-utils`, held at `^2.4.6` per ADR-016).
- Node runtime upgraded to 24 across `Dockerfile` and a new `package.json` `engines` field.
- Zero deprecation/engine warnings from `npm install` in any environment.
- 100% existing test suite passing; no application code changed.
