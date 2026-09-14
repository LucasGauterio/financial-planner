---
kind: phase
name: phase-06-loan-tracker-and-schedules
test_specs_aware: true
sources_mtime:
  docs/phases/phase-06-loan-tracker-and-schedules/CONTEXT.md: "2026-09-14T14:06:02-03:00"
  docs/project-plan.md: "2026-09-11T16:22:27-03:00"
  docs/decisions/technical-decisions-loan-tracker-and-schedules.md: "2026-09-14T14:05:07-03:00"
---

# Phase 06 — Loan Tracker & Credit Installment Schedules

## Objective

Implement credit card limit installment scheduling (`generateCreditCardInstallments`) and casual friend loan metrics engine, delivered via `src/services/loanCalculations.js` and `src/components/LoanTracker.vue`.

---

## Step Implementations

### SI-06.1 — Loan Calculation Engine

**Description:** Pure calculation engine for credit card installment scheduling and casual-loan/credit-loan summary metrics.

**Technical actions:**

1. Create `src/services/loanCalculations.js` — `generateCreditCardInstallments(totalAmount, installmentsCount, startMonthStr, dueDay)`: splits `totalAmount` into flat base installments (floored to 2 decimals) and absorbs the division remainder entirely into the final installment (per `loan-tracker-and-schedules/TD-01`).
2. In the same function, clamp the due day to the last valid day of the target month whenever `dueDay` exceeds `maxDaysInMonth` (per `loan-tracker-and-schedules/TD-02`).
3. Implement `calculateCasualLoanSummary(loan)` — sums `payments`, derives `totalLent`, `totalPaid`, `remainingBalance`, `progressPercent`.
4. Implement `calculateCreditLoanSummary(loan)` — sums `installments` with `status === 'paid'`, derives `totalPaid`, `remainingBalance`, `progressPercent`, `paidInstallmentsCount`, `totalInstallmentsCount`, `nextInstallment`.

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `generateCreditCardInstallments` | Unit: remainder absorption, due-day clamping, year rollover | `src/services/loanCalculations.test.js` |
| `calculateCasualLoanSummary` | Unit: totals, remaining balance, progress percent | `src/services/loanCalculations.test.js` |
| `calculateCreditLoanSummary` | Unit: totals, next installment, progress percent | `src/services/loanCalculations.test.js` |

**Dependencies:** none

**Acceptance criteria:**

- `generateCreditCardInstallments(1000, 3, "2026-01", 15)` returns 3 installments whose amounts sum to exactly `1000`, with the remainder on the last installment.
- `generateCreditCardInstallments` called with `dueDay: 31` against a 30-day month returns a `dueDate` on the last day of that month, not the first of the next month.
- `calculateCasualLoanSummary` on `{amountLent: 100, payments: [{amount: 40}]}` returns `remainingBalance: 60` and `progressPercent: 40`.
- `calculateCreditLoanSummary` on a loan with 3 installments (1 `paid`) returns `paidInstallmentsCount: 1` and `nextInstallment` matching the first `pending` entry.

---

### SI-06.2 — Loan Tracker Vue Component

**Description:** `LoanTracker.vue` component for managing casual friend loans and credit card limit installment schedules, including lifecycle (archive) management and schedule-edit regeneration.

**Technical actions:**

1. Create `src/components/LoanTracker.vue` — load/persist `loans` via `repository.getLoans()`/`repository.saveLoans()`; every loan carries a `type: 'casual' | 'credit'` discriminator inside one unified collection (per `loan-tracker-and-schedules/TD-04`).
2. Implement the aggregate stats dashboard (`totalLent`, `totalRecovered`, `outstandingBalance`, `activeLoansCount`) and the `active`/`completed`/`archived`/`all` filter tabs, excluding `archived` loans from the active view and aggregate totals.
3. Implement `toggleArchive(loan)` — flips `loan.archived` without deleting payment/installment history; keep `deleteLoan` available as a separate, distinct hard-delete action (per `loan-tracker-and-schedules/TD-05`).
4. Implement `updateExistingLoan` — when a credit loan's `totalAmount`, `installmentsCount`, `startMonth`, or `dueDay` changes, fully regenerate `installments` via `generateCreditCardInstallments` after a `confirm()` prompt, discarding prior `status`/`paymentDate` (per `loan-tracker-and-schedules/TD-03`).
5. Implement `addRepayment`/`deleteRepayment` (casual loans) and `toggleInstallmentStatus` (credit loans), persisting via `repository.saveLoans`.

**Tests:**

| Artifact | Layer | Test file |
|----------|-------|-----------|
| `LoanTracker.vue` | Component: active/completed/archived/all filters, stats dashboard | `src/components/LoanTracker.test.js` |
| `LoanTracker.vue` | Component: create/edit flow for casual and credit loans | `src/components/LoanTracker.test.js` |
| `LoanTracker.vue` | Component: schedule regeneration on parameter edit + confirm gate | `src/components/LoanTracker.test.js` |

**Dependencies:** SI-06.1 — needs the calculation functions already implemented.

**Acceptance criteria:**

- Creating a casual loan via the form persists an entry with `type: 'casual'` and `payments: []` in the repository.
- Creating a credit loan via the form persists an entry with `type: 'credit'` and `installments` generated by `generateCreditCardInstallments`.
- Archiving a loan removes it from the `active` filter and aggregate totals, while it remains visible under the `archived` filter.
- Editing `installmentsCount` on a credit loan with paid installments, after confirmation, replaces `installments` entirely (no `status: 'paid'` entry survives).

---

## Technical Specifications

### Data Model

#### Loan

| Field | Type | Constraints |
|-------|------|-------------|
| id | string | generated client-side (`generateSecureId()`), unique per loan |
| type | string | `'casual' \| 'credit'` — discriminator _(per loan-tracker-and-schedules/TD-04)_ |
| friendName | string | required |
| loanName | string | required |
| notes | string | optional |
| archived | boolean | default `false` — hides the loan from the active view and aggregate stats without deleting it _(per loan-tracker-and-schedules/TD-05)_ |

**Casual-loan-only fields** (`type: 'casual'`):

| Field | Type | Constraints |
|-------|------|-------------|
| amountLent | number | required, > 0 |
| dateLent | string | `YYYY-MM-DD`, required, year ≥ 1900 |
| payments | array of Payment | starts as `[]` |

**Credit-loan-only fields** (`type: 'credit'`):

| Field | Type | Constraints |
|-------|------|-------------|
| totalAmount | number | required, > 0 |
| installmentsCount | number | required, 1–120 |
| startMonth | string | `YYYY-MM`, required, year ≥ 1900 |
| dueDay | number | required, 1–31; clamped per-installment to the month's last valid day when the month is shorter _(per loan-tracker-and-schedules/TD-02)_ |
| cardName | string | optional |
| installments | array of Installment | fully regenerated whenever `totalAmount`, `installmentsCount`, `startMonth`, or `dueDay` change, discarding prior `status`/`paymentDate` _(per loan-tracker-and-schedules/TD-03)_ |

#### Payment (casual-loan repayment record)

| Field | Type | Constraints |
|-------|------|-------------|
| id | string | generated client-side |
| amount | number | required, > 0, ≤ remaining balance at record time |
| date | string | `YYYY-MM-DD`, required, year ≥ 1900 |
| notes | string | optional |

#### Installment (credit-loan schedule entry)

| Field | Type | Constraints |
|-------|------|-------------|
| number | number | 1-indexed, sequential |
| dueDate | string | `YYYY-MM-DD` |
| amount | number | flat base amount for every installment except the last, which also absorbs the division remainder _(per loan-tracker-and-schedules/TD-01)_ |
| status | string | `'pending' \| 'paid'` |
| paymentDate | string | `YYYY-MM-DD` when `status: 'paid'`, otherwise `''` |

**Relations:** `Loan` has many `Payment` (casual loans only) or many `Installment` (credit loans only) — both are embedded arrays inside the `Loan` object, not separate collections.
**Indexes:** none — every `Loan` persists as part of a single encrypted array under one repository key (`LOANS_KEY`); there is no per-record query engine _(per loan-tracker-and-schedules/TD-04)_.

---

<!-- phase-a-complete -->

## Dependency Map

```
SI-06.1 (root)
└── SI-06.2 — depends on SI-06.1 (calculation engine must exist before the component wires into it)
```

---

## Deliverables

- [x] SI-06.1 — Loan Calculation Engine
- [x] SI-06.2 — Loan Tracker Vue Component

**Full test suites:**

- [x] Tests pass (`npx vitest run`) — 53/53 passing, including `loanCalculations.test.js` (11/11) and `LoanTracker.test.js` (7/7, added retroactively).
- [ ] Type/compilation checks pass (`npm run build`) — not run as part of this retroactive documentation pass.
