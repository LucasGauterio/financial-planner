# ADR-004: Expense Tracker Persistence & Projection Layer — Reuse of Income Tracker Pattern

- **Status**: Accepted
- **Date**: 2026-09-14
- **Deciders**: AI Software Architect, Core Engineering Team
- **Related decisions**: ADR-001 (Offline-First IndexedDB Storage), ADR-001 (Zero-Trust Client-Side Vault Encryption), ADR-002 (Decoupled Pure Financial Math Service Layer), [Technical Decisions — Monthly Income Registration & Projections](../decisions/technical-decisions-monthly-income-tracker.md)

---

## Context and Problem Statement

Phase 8 (Monthly Expense Registration & Projections) introduces expense sources (fixed bills, variable spending, subscriptions) that need the same shape of capability Phase 7 already built for income: an optionally-recurring source, a month-by-month projection (paid vs. pending) with monthly totals, projectable up to 35 years. The question is whether expense tracking warrants its own projection data model, cadence representation, rendering strategy, and default-status policy, or whether it should conform to the income tracker's already-decided pattern ([`technical-decisions-monthly-income-tracker.md`](../decisions/technical-decisions-monthly-income-tracker.md), TD-01..TD-04).

---

## Decision

Expense data conforms to the income tracker's existing pattern; no new architectural pattern or technical decision was introduced:

1. **Projection data model** — expense sources persist only a recurring rule (amount, start month, `recurring` flag) plus a sparse `{sourceId, "YYYY-MM"} → status` override map; the month-by-month list is derived on read via a `generateExpenseProjection`-style pure function mirroring [`src/services/incomeCalculations.js`](../../src/services/incomeCalculations.js#L15-L54) (`generateIncomeProjection`), reusing income tracker TD-01 (Option B) rather than materializing a fixed-count schedule like [`src/services/loanCalculations.js`](../../src/services/loanCalculations.js#L15-L59).
2. **Recurrence cadence** — a boolean `recurring` flag, monthly-only, reusing income tracker TD-02 (Decision: Option A); quarterly/annual bills are registered as separate one-off entries, same as income.
3. **Category label** — `type` is a free-text field (e.g., "Fixed bill", "Variable spending", "Subscription"), mirroring the free-text `type` field already used for income sources ([`src/components/IncomeTracker.vue`](../../src/components/IncomeTracker.vue#L85-L86)); no enum/taxonomy was introduced.
4. **Long-horizon rendering** — a user-selectable horizon (short default, up to 35 years), reusing income tracker TD-03 (Decision: Option B), extending the grouped-list rendering pattern already used by `IncomeTracker.vue` and [`src/components/InvestmentTimeline.vue`](../../src/components/InvestmentTimeline.vue#L42-L75).
5. **Paid/Pending default status** — every month defaults to `pending` until explicitly confirmed, reusing income tracker TD-04 (Decision: Option B); no date-inferred "auto-paid" assumption was introduced.
6. **Persistence** — a single new key (`EXPENSES_KEY`) is added to the existing repository, following the same `get`/`set` encrypted-blob-per-domain convention used for investments, goals, timeline, loans, and income ([`src/services/indexedDbRepository.js`](../../src/services/indexedDbRepository.js#L14-L19)) (reuses ADR-001 — Offline-First IndexedDB Storage).
7. **Encryption at rest** — expense data passes through the same `encryptData`/`decryptData` AES-GCM + PBKDF2 pipeline ([`src/services/indexedDbRepository.js`](../../src/services/indexedDbRepository.js#L117-L124)) as every other domain (reuses ADR-001 — Zero-Trust Client-Side Vault Encryption).
8. **Business logic separation** — all expense math (projection derivation, monthly totals) lives in a pure, side-effect-free module, `src/services/expenseCalculations.js`, mirroring `incomeCalculations.js` and the pure-function convention set by `financialCalculations.js`; `ExpenseTracker.vue` only orchestrates component state and calls into this module (reuses ADR-002 — Decoupled Pure Financial Math Service Layer).

---

## Considered Alternatives

### Alternative A: Materialized per-month schedule (loan-installment pattern) for expenses
- **Rejected** — same rationale as income tracker TD-01: a 35-year horizon per recurring source would produce up to 420 stored rows per source, re-encrypted and rewritten on every save; the sparse-override pattern already proven for income avoids this without losing any capability.

### Alternative B: Fixed enum of expense categories (`fixedBill`, `variableSpending`, `subscription`) instead of free text
- **Rejected** — would introduce a taxonomy layer with no precedent in the income tracker (which uses free text for an analogous label) and no stated requirement to filter/aggregate by category; a free-text field covers the three named examples plus any category the user names, consistent with income's `type` field.

### Alternative C: Dedicated expense-specific decisions document re-deriving TD-01..TD-04 from scratch
- **Rejected** — the phase 8 capability explicitly states the model mirrors the income tracker; re-deriving already-decided trade-offs (materialized vs. derived schedule, cadence representation, rendering strategy, default status) would duplicate `technical-decisions-monthly-income-tracker.md` without a new question to resolve, violating the no-cross-document-duplication convention.

---

## Consequences

### Positive
- Zero new architectural surface: reviewers reason about expense persistence, projection, and encryption using the same mental model as income (and, transitively, investments/goals/timeline/loans).
- `expenseCalculations.js` is independently unit-testable via Vitest with no Vue/DOM dependency, consistent with `incomeCalculations.js` and `loanCalculations.js`.
- No new technical-decisions document was needed for this phase, keeping the decisions corpus free of duplicated TDs.

### Negative
- Expense sources inherit income's TD-02 constraint (monthly-only recurrence): a genuinely quarterly/annual bill still requires separate one-off entries, same limitation income accepted.
- Expense sources inherit the single encrypted blob-per-key convention (not a queryable per-record store), so every save re-encrypts and rewrites the entire expenses array — the same constraint already accepted for loans and income under ADR-001.

---

## References
- [ADR-001 — Offline-First IndexedDB Storage with Client-Side AES-GCM Encryption](ADR-001-offline-indexeddb-storage.md)
- [ADR-001 — Zero-Trust Client-Side Vault Encryption](ADR-001-zero-trust-client-encryption.md)
- [ADR-002 — Decoupled Pure Financial Math Service Layer](ADR-002-decoupled-math-service-layer.md)
- [ADR-003 — Loan Tracker Persistence & Calculation Layer — Reuse of Established Patterns](ADR-003-loan-tracker-pattern-reuse.md)
- [`src/services/incomeCalculations.js`](../../src/services/incomeCalculations.js#L1-L78)
- [`src/components/IncomeTracker.vue`](../../src/components/IncomeTracker.vue#L85-L86)
- [`src/services/indexedDbRepository.js`](../../src/services/indexedDbRepository.js#L14-L19)
- [Technical Decisions — Monthly Income Registration & Projections](../decisions/technical-decisions-monthly-income-tracker.md)
