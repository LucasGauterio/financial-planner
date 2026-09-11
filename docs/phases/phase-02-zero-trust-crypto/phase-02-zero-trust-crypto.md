# Phase 02: Zero-Trust Client Encryption Vault

## Objective
Implement client-side PBKDF2 key derivation and AES-GCM vault encryption using Web Crypto API (`window.crypto.subtle`) prior to browser persistence.

## Dependency Map
- Depends on Phase 01 core setup.

## Step Implementations (SIs)

### SI-01: Master Password Key Derivation
- Implement volatile key memory management and PBKDF2 key derivation in `useAuth.js`.
- Target files:
  - [`src/composables/useAuth.js`](file:///G:/Projects/FinancialPlanner/src/composables/useAuth.js#L1-L60)
  - [`src/components/LockScreen.vue`](file:///G:/Projects/FinancialPlanner/src/components/LockScreen.vue#L1-L90)

### SI-02: AES-GCM Storage Encryption Layer
- Implement ciphertext encryption/decryption routines before browser persistence.
- Target files:
  - [`src/services/cryptoService.js`](file:///G:/Projects/FinancialPlanner/src/services/cryptoService.js#L1-L75)
  - [`src/composables/useStorage.js`](file:///G:/Projects/FinancialPlanner/src/composables/useStorage.js#L1-L70)
  - [`src/services/indexedDbRepository.js`](file:///G:/Projects/FinancialPlanner/src/services/indexedDbRepository.js#L1-L150)
  - [`src/services/localStorageRepository.js`](file:///G:/Projects/FinancialPlanner/src/services/localStorageRepository.js#L1-L100)
- Tests: `npx vitest run src/services/cryptoService.test.js`, `npx vitest run src/services/localStorageRepository.test.js`.

## Deliverables
- Zero-trust encrypted IndexedDB storage layer.
- Master Password lock/unlock lifecycle handling.
