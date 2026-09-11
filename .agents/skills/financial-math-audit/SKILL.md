---
name: financial-math-audit
description: Audits financial math calculations, edge cases (zero yield, negative contributions, compound periods), and Vitest test coverage.
triggers:
  - /financial-math-audit
  - audit math
  - check calculations
---

Perform a comprehensive mathematical audit on `src/services/financialCalculations.js`:

1. **Edge Case Verification**:
   - Zero contribution or zero yield scenarios.
   - Fractional compounding periods (months vs years).
   - Large timeline projections (100+ years).

2. **Run Vitest Suite**:
   - Command: `npx vitest run src/services/financialCalculations.test.js --coverage`

3. **Report Audit Results**:
   - Detail any missing assertions, precision issues (`Number.EPSILON`), or edge-case bugs.
