# Phase 02: Zero-Trust Client Encryption Vault

## Objective
Implement client-side PBKDF2 key derivation and AES-GCM vault encryption using Web Crypto API (`window.crypto.subtle`) prior to browser persistence.

## Dependency Map
- Depends on Phase 01 core setup.

## Step Implementations (SIs)

### SI-01: Master Password Authentication Composable
- Implement volatile key memory management in `src/composables/useAuth.js`.
- Target files: `src/composables/useAuth.js`.

### SI-02: AES-GCM Storage Encryption Layer
- Implement ciphertext encryption and decryption routines before IndexedDB writes in `src/composables/useStorage.js`.
- Target files: `src/composables/useStorage.js`, `src/services/localStorageRepository.js`.
- Tests: `npx vitest run src/services/localStorageRepository.test.js`.

## Deliverables
- Zero-trust encrypted IndexedDB storage layer.
- Master Password lock/unlock lifecycle handling.
