# Phase 05: i18n Localization & Encrypted Vault Backups

## Objective
Implement dual-locale reactive internationalization (`en-US`, `pt-BR`) and encrypted vault JSON import/export automation.

## Dependency Map
- Depends on Phase 01 through 04.

## Step Implementations (SIs)

### SI-01: i18n Composable & Translation Dictionaries
- Implement `useI18n.js` with `en-US.js` and `pt-BR.js` translation dictionaries.
- Target files:
  - [`src/composables/useI18n.js`](file:///G:/Projects/FinancialPlanner/src/composables/useI18n.js#L1-L89)
  - [`src/locales/en-US.js`](file:///G:/Projects/FinancialPlanner/src/locales/en-US.js#L1-L100)
  - [`src/locales/pt-BR.js`](file:///G:/Projects/FinancialPlanner/src/locales/pt-BR.js#L1-L100)

### SI-02: Encrypted Backup Export & Import
- Build export/import helper routines to output encrypted `.json` vault backups.
- Target files:
  - [`src/composables/useStorage.js`](file:///G:/Projects/FinancialPlanner/src/composables/useStorage.js#L1-L70)
  - [`src/components/OptionsModal.vue`](file:///G:/Projects/FinancialPlanner/src/components/OptionsModal.vue#L1-L100)
- Tests: `npx vitest run`.

## Deliverables
- Dual-locale support (`en-US` and `pt-BR`).
- Encrypted JSON backup import/export.
