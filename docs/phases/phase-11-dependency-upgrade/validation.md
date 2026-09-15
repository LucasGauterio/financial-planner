# phase-11-dependency-upgrade — Validation

## Findings

### Inconsistencies
_None._

### Ambiguities
_None._ The user's request ("full upgrade of all project dependencies, libraries, frameworks, including node and vue") is concrete; the two genuinely open trade-offs it implied (whether to bump `@vue/test-utils` to `2.5.0`, and whether to adopt Vue 3.6) are resolved and recorded in [ADR-016](../../adrs/ADR-016-full-dependency-and-runtime-upgrade.md) rather than left ambiguous.

### Missing Decisions
_None._ Every version target (patch/minor-within-major vs. major bump vs. deliberately held back) is decided and justified in ADR-016.

### Dependency Gaps
_None._ This phase depends on nothing (no application code, only the build/test toolchain) and blocks nothing.

### Inherited Constraint Conflicts
_None._ The one real conflict this phase surfaced — `@vue/test-utils@2.5.0`'s `js-beautify@2.x` requiring a Node engine BUGFIX-004's `glob` override was written to sidestep — was resolved by *not* taking that upgrade, not by relaxing BUGFIX-004's constraint.

### Unresolved Open Questions
_None._

### UI Coverage Gaps
_Not applicable — this phase changes no UI._

## Resolved Issues

### Vitest 5 `localStorage` getter break
- **Found during:** SI-11.3 full-suite regression run.
- **Symptom:** `TypeError: Cannot set property localStorage of [object Window] which has only a getter` in `src/services/localStorageRepository.test.js`'s `beforeEach`.
- **Resolution:** replaced direct `global.localStorage = {...}` assignment with `vi.stubGlobal('localStorage', {...})`. See `progress.md` SI-11.3 for detail.
