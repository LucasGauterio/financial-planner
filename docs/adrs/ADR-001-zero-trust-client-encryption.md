# ADR-001: Zero-Trust Client-Side Vault Encryption

- **Status**: Accepted
- **Date**: 2026-09-11
- **Deciders**: Software Architecture Team

## Context & Problem Statement
FinancialPlanner tracks sensitive financial assets, balances, yields, and goal targets in browser storage. Plaintext storage in IndexedDB/LocalStorage creates security vulnerabilities if the device is compromised or inspected.

## Decision Outcome
Chosen Option: **Native Web Crypto API (`AES-GCM` with `PBKDF2` key derivation)**.

### Rationale:
- PBKDF2 derives an encryption key locally from a user Master Password.
- AES-GCM provides authenticated encryption before writing payload to IndexedDB.
- Master Password key is held ONLY in volatile memory (`useAuth.js`) and never serialized to disk.
