# ADR-003: Loan Tracker Persistence & Calculation Layer — Reuse of Established Patterns

- **Status**: Accepted
- **Date**: 2026-09-14
- **Deciders**: AI Software Architect, Core Engineering Team
- **Related decisions**: ADR-001 (Offline-First IndexedDB Storage), ADR-001 (Zero-Trust Client-Side Vault Encryption), ADR-002 (Decoupled Pure Financial Math Service Layer), [Technical Decisions — Loan Tracker & Credit Installment Schedules](../decisions/technical-decisions-loan-tracker-and-schedules.md)

---

## Context and Problem Statement

Phase 6 (Loan Tracker & Credit Installment Schedules) introduces a new domain — casual friend loans and credit card limit installment schedules — that needs persistent storage, encryption at rest, and a calculation engine (`generateCreditCardInstallments`, `calculateCasualLoanSummary`, `calculateCreditLoanSummary`). The question is whether this domain warrants a new architectural pattern (a dedicated storage mechanism, a different encryption scheme, or business logic embedded directly in the Vue component) or whether it should conform to the patterns already established by ADR-001 and ADR-002.

---

## Decision

Loan data conforms to the existing architecture; no new architectural pattern was introduced:

1. **Persistence** — a single new key (`LOANS_KEY`) was added to the existing repository, following the same `get`/`set` encrypted-blob-per-domain convention already used for investments, goals, timeline, and income ([`src/services/indexedDbRepository.js`](../../src/services/indexedDbRepository.js#L14-L17)). No new storage backend or per-domain schema mechanism was introduced (reuses ADR-001 — Offline-First IndexedDB Storage).
2. **Encryption at rest** — loan data passes through the same `encryptData`/`decryptData` AES-GCM + PBKDF2 pipeline ([`src/services/indexedDbRepository.js`](../../src/services/indexedDbRepository.js#L117-L124)) as every other domain; no per-domain encryption variant was created (reuses ADR-001 — Zero-Trust Client-Side Vault Encryption).
3. **Business logic separation** — all loan math (installment generation, remainder absorption, due-date clamping, casual/credit summaries) lives in a pure, side-effect-free module, [`src/services/loanCalculations.js`](../../src/services/loanCalculations.js#L1-L119), covered by `src/services/loanCalculations.test.js`, mirroring the pure-function convention set by `financialCalculations.js`. `LoanTracker.vue` only orchestrates component state and calls into this module (reuses ADR-002 — Decoupled Pure Financial Math Service Layer).

---

## Considered Alternatives

### Alternative A: Dedicated storage key/collection scheme for loans (e.g., separate object store, unencrypted metadata index for faster filtering)
- **Rejected** — would fork the storage layer's `get`/`set` contract per-domain instead of reusing the single object-store + per-key-blob convention every other domain already follows, adding maintenance surface for no functional benefit; filtering (`active`/`completed`/`archived`) is cheap enough to do client-side over the decrypted array.

### Alternative B: Inline loan math inside `LoanTracker.vue`'s `<script setup>` block
- **Rejected** — would break the pure-service-layer separation ADR-002 already established for the rest of the app's financial math, making the installment rounding/date logic harder to unit-test in isolation and inconsistent with `financialCalculations.js`'s precedent.

---

## Consequences

### Positive
- Zero new architectural surface: reviewers and future contributors reason about loan persistence and encryption using the same mental model as every other domain in the app.
- `loanCalculations.js` is independently unit-testable via Vitest with no Vue/DOM dependency, consistent with the rest of `src/services/`.

### Negative
- Because loans share the single encrypted blob-per-key convention (not a queryable per-record store), every save re-encrypts and rewrites the entire loans array — acceptable at the scale of a personal finance tracker's loan list, but a constraint inherited from ADR-001 rather than one this phase could avoid on its own.

---

## References
- [ADR-001 — Offline-First IndexedDB Storage with Client-Side AES-GCM Encryption](ADR-001-offline-indexeddb-storage.md)
- [ADR-001 — Zero-Trust Client-Side Vault Encryption](ADR-001-zero-trust-client-encryption.md)
- [ADR-002 — Decoupled Pure Financial Math Service Layer](ADR-002-decoupled-math-service-layer.md)
- [`src/services/loanCalculations.js`](../../src/services/loanCalculations.js#L1-L119)
- [`src/services/indexedDbRepository.js`](../../src/services/indexedDbRepository.js#L14-L17)
- [`src/components/LoanTracker.vue`](../../src/components/LoanTracker.vue#L467-L478)
- [Technical Decisions — Loan Tracker & Credit Installment Schedules](../decisions/technical-decisions-loan-tracker-and-schedules.md)
