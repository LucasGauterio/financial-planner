# Functional Design Document (FDD): FinancialPlanner

## 1. System Context Diagram (C4 Level 1)

```mermaid
graph TD
    User([User / Investor]) -->|Uses SPA in Browser| App[FinancialPlanner Web App]
    App -->|Reads/Writes Encrypted Data| IDB[(Local IndexedDB Vault)]
    App -->|Uses Hardware/Browser Crypto| WebCrypto[Web Crypto API]
```

---

## 2. Container Diagram (C4 Level 2)

```mermaid
graph TD
    subgraph SPA [FinancialPlanner Single Page Application]
        Views[Vue 3 Views & Components]
        Composables[Composition API Hooks]
        Services[Domain Logic Services]
        Repo[IndexedDB Repository]
    end

    Views --> Composables
    Views --> Services
    Composables --> Repo
    Services --> Repo
    Repo -->|AES-GCM Payload| IDB[(Browser IndexedDB)]
```

---

## 3. Component Interactions & Sequence Flow

### 3.1 Vault Unlocking Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant LockScreen as LockScreen.vue
    participant Auth as useAuth.js
    participant Crypto as cryptoService.js
    participant IDB as indexedDbRepository.js

    User->>LockScreen: Enters Master Password
    LockScreen->>Crypto: deriveKey(password, salt)
    Crypto-->>LockScreen: AES-GCM CryptoKey
    LockScreen->>Auth: setVaultKey(CryptoKey)
    LockScreen->>IDB: loadEncryptedVault(CryptoKey)
    IDB->>Crypto: decryptData(key, cipherText)
    Crypto-->>IDB: Decrypted JSON Payload
    IDB-->>LockScreen: State Restored & App Unlocked
```

---

## 4. Subsystem Functional Specifications

### 4.1 Compound Interest Calculation Engine
- **Module**: `src/services/financialCalculations.js`
- **Functions**: `calculateCompoundInterest`, `calculateRequiredMonthlyContribution`
- **Formula**:
  $$\text{Balance}_{m} = \text{Balance}_{m-1} \times (1 + r) + \text{PMT}_m$$
  where $\text{PMT}_m$ escalates annually by $(1 + \text{Increase}\%)$.

### 4.2 Loan & Installment Schedule Engine
- **Module**: `src/services/loanCalculations.js`
- **Functions**: `generateCreditCardInstallments`, `calculateCasualLoanSummary`, `calculateCreditLoanSummary`
- **Remainder Absorbance**: Floored base amounts are allocated across months, and division remainders are absorbed strictly into the final installment to avoid sub-cent floating point discrepancies.
