# phase-11-dependency-upgrade — Progress

**Status:** completed
**SIs:** 5/5 completed

### SI-11.1 — Patch/Minor Bumps Within Current Major
- **Status:** completed
- **Tests:** 148 passing
- **Observations:** `vue` 3.5.32 → 3.5.42, `@vitejs/plugin-vue` 6.0.6 → 6.0.9, `vite` 8.0.8 → 8.3.0. Drop-in — no config or test changes needed.

### SI-11.2 — Node Runtime Upgrade (Node 20 → 24)
- **Status:** completed
- **Observations:** `Dockerfile`'s builder stage moved to `node:24-alpine`; `package.json` gained `"engines": { "node": ">=24" }`. `npm run build` unaffected locally (this environment's own Node is v25.2.1, already ≥24).

### SI-11.3 — Vitest 4 → 5 and `@vitest/coverage-v8` 4 → 5 (major)
- **Status:** completed
- **Tests:** 144/148 passing initially, then 148/148 after one fix
- **Observations:** One real breaking change surfaced: `src/services/localStorageRepository.test.js` directly assigned `global.localStorage = {...}` in `beforeEach`, which threw `TypeError: Cannot set property localStorage of [object Window] which has only a getter` under the new jsdom/vitest 5 environment wiring (`window.localStorage` is now a non-configurable getter). Fixed by switching to `vi.stubGlobal('localStorage', {...})` — Vitest's purpose-built API for exactly this case, which works regardless of the target property's descriptor. No other test or config change was needed; `vite.config.js`'s `test` block (`environment: 'jsdom'`, `globals: true`, `reporters`, `coverage.provider: 'v8'`) required zero shape changes, matching what the Vitest 5 migration guide predicted for this config shape.
- Vitest 5 also prints a new performance hint ("Environment jsdom was created 17 times... create it once per worker with pool: 'vmThreads' or isolate: false") — not acted on, since changing test isolation/pooling is a behavioral trade-off beyond this phase's "no user-facing or test-behavior change" scope; noted here for a future phase to consider.

### SI-11.4 — jsdom 29 → 30 (major)
- **Status:** completed
- **Tests:** 148 passing
- **Observations:** No jsdom-API-surface regressions surfaced through `@vue/test-utils`'s DOM interactions or the fixed `localStorageRepository.test.js`. Test suite wall-clock time increased noticeably (jsdom environment setup went from ~9.8s to ~18-20s total across 17 files) — jsdom 30 appears heavier to initialize per-file; same non-blocking observation as SI-11.3's pooling hint.

### SI-11.5 — Full-Suite Regression & Deploy-Warning Verification
- **Status:** completed
- **Tests:** 148 passing (from a fully clean `node_modules` reinstall); `npm run build` succeeds
- **Observations:**
  - `npm install` from scratch shows **zero deprecation warnings** (the `glob` override from BUGFIX-004 remains effective — `js-beautify` stayed on its `1.15.4`/`nopt@^7.2.1` line, confirmed via `npm ls`).
  - `npm install` **does** show two `EBADENGINE` warnings for `vitest@5.0.1` and `jsdom@30.0.1` on **this specific sandbox**, because its own installed Node is `v25.2.1` — an odd-numbered "Current" (non-LTS) release matching neither package's engines range (`^22.12.0 || ^24.0.0 || >=26.0.0` / `^22.22.2 || ^24.15.0 || >=26.0.0`). This is expected and does not indicate a problem with the upgrade: the actual deploy build (`Dockerfile`'s `node:24-alpine`) satisfies both ranges cleanly, and any developer machine running an actual LTS release (22, 24, or 26) would see no warning either. This is the exact trade-off documented in [ADR-016](../../adrs/ADR-016-full-dependency-and-runtime-upgrade.md)'s Alternative A — a local machine's Node version is outside this project's control.
