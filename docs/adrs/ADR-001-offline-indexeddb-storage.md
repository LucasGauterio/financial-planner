# ADR-001: Offline-First IndexedDB Storage with Client-Side AES-GCM Encryption

- **Status**: Approved
- **Date**: 2026-09-11
- **Deciders**: AI Software Architect, Core Engineering Team

---

## Context
FinancialPlanner handles sensitive user wealth data, investment goals, and loan tracking. Transmitting this data to a remote cloud database introduces privacy risks and requires infrastructure maintenance. Furthermore, users require offline accessibility.

---

## Decision
We decided to adopt an **Offline-First Storage Engine** using IndexedDB wrapped with native Web Crypto API AES-GCM 256-bit encryption.

Key elements of this decision:
1. **Zero-Knowledge Encryption**: Plaintext data is never written to disk. The master password derives an AES-GCM key in memory.
2. **Web Crypto API**: Native `window.crypto.subtle` is used instead of external crypto libraries to minimize bundle size and leverage hardware acceleration.
3. **Structured Repository Pattern**: Data access is centralized in `src/services/indexedDbRepository.js` and managed via Vue hooks (`useAuth.js`).

---

## Consequences

### Positive
- Maximum user privacy; zero server-side breach risk.
- Fully operational without an active internet connection.
- Fast local read/write performance.

### Negative
- Password recovery is impossible if the user loses their master password.
- Multi-device sync requires manual export/import of encrypted backup JSON files (`BackupManager.vue`).
