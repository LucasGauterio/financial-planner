# ADR-016: Full Dependency & Runtime Upgrade (Phase 11)

- **Status**: Accepted
- **Date**: 2026-09-15
- **Deciders**: Core Engineering Team
- **Related decisions**: [BUGFIX-004](../TRACKER.md#bug-fix-traceability) — glob deprecation pin, a constraint this ADR's Node upgrade partially (but not fully) supersedes

---

## Context and Problem Statement

The user requested a full upgrade of every project dependency, library, and framework — explicitly including Node and Vue — as its own phase (Phase 11). At the time of this decision:

| Package | Installed | Latest available | Gap |
|---|---|---|---|
| `vue` | 3.5.32 | 3.5.42 | patch |
| `@vitejs/plugin-vue` | 6.0.6 | 6.0.9 | patch |
| `vite` | 8.0.8 | 8.3.0 | minor |
| `vitest` | 4.1.6 | 5.0.1 | **major** |
| `@vitest/coverage-v8` | 4.1.6 | 5.0.1 | **major** |
| `jsdom` | 29.0.2 | 30.0.1 | **major** |
| `@vue/test-utils` | 2.4.6 | 2.5.0 | minor |
| Node (Dockerfile `node:20-alpine`) | 20 | 24 (Active/Maintenance LTS) | **major** |

`vitest@5` requires Node `^22.12.0 || ^24.0.0 || >=26.0.0` and Vite `^6.4.0 || ^7.0.0 || ^8.0.0`; `jsdom@30` requires Node `^22.22.2 || ^24.15.0 || >=26.0.0`. Neither will install cleanly under the project's current `node:20-alpine` build image, so the Node runtime upgrade is not optional if `vitest`/`jsdom` are to reach their latest majors — the two upgrades are coupled.

Separately, [BUGFIX-004](../TRACKER.md#bug-fix-traceability) pinned `glob` to `^13.0.6` via an npm `overrides` entry specifically to avoid `@vue/test-utils@2.5.0`'s `js-beautify@2.x` dependency, whose own `nopt@10` transitive dependency requires Node `>=22.22.2/24.15.0/26.0.0` — a requirement the then-current `node:20-alpine` build image couldn't satisfy. That constraint is largely resolved by this ADR's Node 24 upgrade, but the *local development* Node version remains outside this project's control (it is whatever the developer's machine has installed), so a workaround kept purely for Docker-build correctness is not enough to guarantee a warning-free `npm install` in every environment.

---

## Decision

1. **Bump every package within its already-current major** to the latest release: `vue` → `3.5.42`, `@vitejs/plugin-vue` → `6.0.9`, `vite` → `8.3.0`. These are drop-in upgrades (no API changes affecting this codebase).
2. **Bump `vitest` and `@vitest/coverage-v8` to `5.0.1`** (major). Verified via the official migration guide: the only changes relevant to this project's `vite.config.js` are (a) `clearMocks` now defaults to `true` — a superset of the manual `.mockReset()` calls already present in every test file's `beforeEach`, so behaviorally inert here — and (b) built-in reporter output paths changed, which does not affect `vitest-sonar-reporter` (a third-party reporter with its own explicit `outputFile` option, unaffected). No config changes were required.
3. **Bump `jsdom` to `30.0.1`** (major), required transitively by `vitest@5`'s `environment: 'jsdom'` support and to keep the direct dependency current. Its Node requirement (`^22.22.2 || ^24.15.0 || >=26.0.0`) is met by the Node 24 upgrade below.
4. **Upgrade the Node runtime the project builds and deploys against to Node 24** (the Active/Maintenance LTS line, per nodejs.org's release schedule): `Dockerfile`'s builder stage moves from `node:20-alpine` to `node:24-alpine`, and a new top-level `"engines": { "node": ">=24" }` is added to `package.json` to document the minimum supported runtime for anyone installing locally.
5. **`@vue/test-utils` stays pinned at `^2.4.6`** (not bumped to `2.5.0`) and the `glob` npm override from BUGFIX-003 is **kept as-is**. Rationale in Alternatives below.

---

## Considered Alternatives

### Alternative A: Bump `@vue/test-utils` to `2.5.0` and drop the `glob` override now that Node 24 satisfies `nopt@10`'s engines field
- **Rejected** — the Node 24 upgrade only guarantees the *Docker build* environment's Node version; it does nothing for a developer's local machine, which may run any Node version (including odd-numbered "Current" releases like Node 25, which satisfy none of `^22.22.2 || ^24.15.0 || >=26.0.0`). Keeping `@vue/test-utils` on `^2.4.6` (whose `js-beautify@1.15.4` dependency needs no engine-sensitive `nopt` major) plus the existing `glob` override guarantees a warning-free `npm install` in *any* environment, not just the one this project controls the Node version for. `@vue/test-utils@2.5.0`'s only other change (`vue-component-type-helpers@^3.0.0`, a TypeScript-only helper package unused by this JS-only codebase) provides no benefit here.

### Alternative B: Adopt Vue 3.6 (currently in `beta`/`rc`) instead of staying on the 3.5.x line
- **Rejected** — Vue's own `latest` dist-tag is `3.5.42`; `3.6.0` is only available under `beta`/`rc`/`alpha` tags at the time of this decision. Shipping a pre-release framework version in a production zero-trust financial app is out of scope for a routine maintenance upgrade; revisit once 3.6 reaches `latest`.

### Alternative C: Stay on Node 20 and skip the `vitest`/`jsdom` major bumps entirely
- **Rejected** — the user explicitly asked for a full upgrade including Node; deferring the two majors coupled to the Node version would leave the dependency tree only partially current, defeating the phase's purpose. Node 20 is also approaching its own end-of-life on the LTS schedule, so upgrading now avoids a second forced migration soon after.

---

## Consequences

### Positive
- Every dependency is at its latest compatible release except the one documented, deliberate exception (`@vue/test-utils`).
- `npm install` produces zero deprecation/engine warnings in both the Docker deploy image and (per the `glob` override) any developer's local machine, regardless of that machine's own Node version.
- The project now documents its minimum supported Node version via `package.json`'s `engines` field, which it did not do before.

### Negative
- `@vue/test-utils` will drift further from `latest` over time; this should be revisited in a future phase once `js-beautify`'s Node-version-sensitive `nopt` dependency is no longer a concern (e.g. once Node 20/22 fully age out and a modern engines floor is uncontroversial for every environment this project runs in, including contributors' local machines).
- Vue 3.6 is intentionally not adopted; a future phase should revisit this once it reaches `latest`.

---

## References
- [`package.json`](../../package.json)
- [`Dockerfile`](../../Dockerfile)
- [BUGFIX-004](../TRACKER.md#bug-fix-traceability) — the `glob` override this ADR keeps in place
- [Vitest 5 migration guide](https://vitest.dev/guide/migration.html)
- [Node.js release schedule](https://nodejs.org/en/about/previous-releases)
