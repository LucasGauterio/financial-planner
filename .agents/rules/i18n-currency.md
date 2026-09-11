# Rule: Internationalization (i18n) & Currency Handling

## Directives
1. **Bi-Lingual Sync**: FinancialPlanner supports English (`en-US`) and Portuguese (`pt-BR`).
   - Every user-visible string label, tooltip, tab title, or error message MUST exist in BOTH `src/locales/en-US.js` and `src/locales/pt-BR.js`.
2. **No Hardcoded Strings**:
   - Never write raw text in template headers or buttons (e.g. `<h2>Portfolio</h2>`).
   - Always use the reactive translation hook: `const { t } = useI18n()` and `t('portfolio.title')`.
3. **Currency & Number Formatting**:
   - FinancialPlanner is currency-agnostic.
   - Use `Intl.NumberFormat` helpers or `formatCurrency(amount, locale, currency)` for displaying balances, interest rates, and timeline values.
