# CLAUDE.md

## Commands
- **Dev server**: `npm run dev` (run only when explicitly asked to run/serve app)
- **Run tests**: `npm run test` or `npx vitest run`
- **Single test**: `npx vitest run src/services/financialCalculations.test.js`
- **Build**: `npm run build`

## Architecture & Code Conventions

- **Vue 3 Composition API**: Use `<script setup>` syntax across all `.vue` components.
- **Pure Math Logic**: Offload financial calculations to `src/services/financialCalculations.js`. Write corresponding Vitest tests.
- **Vanilla CSS**: Styled with modern dark theme tokens (`src/style.css`). Do not install or use TailwindCSS unless explicitly asked.
- **i18n Localization**: Custom reactive i18n hook (`src/composables/useI18n.js`). Add all text labels to both `src/locales/en-US.js` and `src/locales/pt-BR.js`.
- **Zero-Trust Encryption**: Native Web Crypto API (`PBKDF2` key derivation, `AES-GCM` cipher). IndexedDB payloads must be encrypted before persisting. Never use `v-html`.

## Verification Loop
Always run `npm run test` after editing code to confirm no regressions were introduced.
