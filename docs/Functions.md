# Function Documentation

This document serves as a comprehensive reference for the core mathematical, scheduling, and operational functionality abstracted throughout the Financial Planner application.

---

## 1. Mathematical Algorithms

### 1.1 Financial Growth & Goal Algorithms
Location: `src/services/financialCalculations.js`

#### `calculateCompoundInterest(principal, startingMonthlyContribution, monthlyRate, months, annualApportIncreasePercent = 0, elapsedMonthsSinceStart = 0)`

Calculates the final balance and compound interest progression of an investment over a specific period of time. It supports yearly step-up increases to contributions, mimicking salary growth or adjusting for inflation organically.

**Parameters:**

- `principal` (Number): The initial lump-sum amount of the investment.
- `startingMonthlyContribution` (Number): The initial monthly PMT contribution.
- `monthlyRate` (Number): The interest percentage represented as a decimal per month (e.g., `0.01` for 1%).
- `months` (Number): Total duration in months for the calculation.
- `annualApportIncreasePercent` (Number) _Optional_: The percentage by which the monthly contribution increases every 12 months. Default `0`.
- `elapsedMonthsSinceStart` (Number) _Optional_: Modulo offset for when the 12-month annual increases should trigger, useful when simulating intermediate slices of time. Default `0`.

**Returns:**

- (Number): The total final balance at the terminal month of the loop.

---

#### `calculateRequiredMonthlyContribution(targetAmount, principal, monthlyRate, months, annualApportIncreasePercent = 0, elapsedMonthsSinceStart = 0)`

Uses a robust binary search implementation (up to 0.01 mathematical tolerance) to determine precisely what starting monthly contribution is required to hit a specific financial target across a given time scope.

**Parameters:**

- `targetAmount` (Number): The goal total balance desired.
- `principal` (Number): The initial starting sum.
- `monthlyRate` (Number): Expected monthly growth as a decimal.
- `months` (Number): Time vector to reach the goal.
- `annualApportIncreasePercent` (Number) _Optional_: Scheduled yearly contribution percentage increase. Default `0`.
- `elapsedMonthsSinceStart` (Number) _Optional_: Existing time offset for when annual inflation step-ups trigger. Default `0`.

**Returns:**

- (Number): The exact required `startingMonthlyContribution` needed to mathematically solve for `targetAmount`.

---

### 1.2 Loan & Credit Scheduling Algorithms
Location: `src/services/loanCalculations.js`

#### `generateCreditCardInstallments(totalAmount, installmentsCount, startMonthStr, dueDay)`

Generates a scheduled array of monthly installment objects for credit limit loans, dividing total amounts evenly and allocating sub-cent division remainders precisely onto the final installment to avoid floating point drift. Enforces calendar due day validation (clamping max days for shorter months and leap years).

**Parameters:**

- `totalAmount` (Number): Total amount lent or charged.
- `installmentsCount` (Number): Total number of monthly installments.
- `startMonthStr` (String): Starting month in `"YYYY-MM"` format.
- `dueDay` (Number): Preferred day of the month for payment due dates (1–31).

**Returns:**

- (Array): Array of installment objects (`{ number, dueDate, amount, status, paymentDate }`).

---

#### `calculateCasualLoanSummary(loan)`

Computes summary metrics for informal loans (friends/family), evaluating total amount lent, total repayments received, net remaining balance, and repayment progress percentage.

**Parameters:**

- `loan` (Object): The casual loan data object (`{ amountLent, payments }`).

**Returns:**

- (Object): Summary metrics (`{ totalLent, totalPaid, remainingBalance, progressPercent }`).

---

#### `calculateCreditLoanSummary(loan)`

Computes progress metrics and identifies the next pending installment for credit card limit installment loans.

**Parameters:**

- `loan` (Object): The credit card loan object (`{ totalAmount, installments }`).

**Returns:**

- (Object): Installment metrics summary including `nextInstallment` object reference.

---

## 2. Localization (i18n)

Location: `src/composables/useI18n.js`

### `useI18n()`

A reactive Vue composable managing language translation and dynamic currency formatting simultaneously. Automatically syncs natively with browser storage to persist user preferences.

**Returned Functionality:**

- `locale` (Computed): Reflects the current active translation set (e.g., `en-US`, `pt-BR`).
- `currency` (Computed): Reflects the current target currency (e.g., `USD`, `BRL`).
- `setLocale(l)`: Method to mutate and save the language locale parameter to persistent state.
- `setCurrency(c)`: Method to mutate the active currency symbol and localization formatting parameters.
- `t(key, args)`: Translation interpolator matching nested object keys (e.g., `settings.language`) to active dictionary payloads, substituting optional `{args}` brackets iteratively.
- `formatCurrency(val)`: Uses `Intl.NumberFormat` internally bound securely to the currently activated runtime currency state.

---

## 3. Data Persistence

Locations: `src/services/indexedDbRepository.js` and `src/services/localStorageRepository.js`

These files expose identical API signatures that orchestrate data persistence dynamically across application loads. `indexedDbRepository.js` acts as the primary asynchronous database supporting a built-in backward compatibility migration layer specifically for deprecated `localStorage` implementations.

### Repository Default Methods:

- `getInvestments()`: Returns the saved array of active investment profiles.
- `saveInvestments(data)`: Serializes and commits the investment grid array locally.
- `getGoals()`: Returns the configured goals settings mapping.
- `saveGoals(data)`: Serializes and saves goals array dynamically.
- `getLoans()`: Returns the saved array of casual and credit card limit loan profiles.
- `saveLoans(data)`: Serializes and commits the loans data array locally.
- `getTimelineState()`: Yields the history object used to track checked-off historical timeline rows by UI layer composite keys.
- `saveTimelineState(state)`: Persists tracking row checking state globally to maintain continuity among refresh lifecycles.
