# Function Documentation

This document serves as a comprehensive reference for the core mathematical and operational functionality abstracted throughout the Financial Planner application.

---

## 1. Mathematical Algorithms

Location: `src/services/financialCalculations.js`

### `calculateCompoundInterest(principal, startingMonthlyContribution, monthlyRate, months, annualApportIncreasePercent = 0, elapsedMonthsSinceStart = 0)`

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

### `calculateRequiredMonthlyContribution(targetAmount, principal, monthlyRate, months, annualApportIncreasePercent = 0, elapsedMonthsSinceStart = 0)`

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
- `getTimelineState()`: Yields the history object used to track checked-off historical timeline rows by UI layer composite keys.
- `saveTimelineState(state)`: Persists tracking row checking state globally to maintain continuity among refresh lifecycles.
