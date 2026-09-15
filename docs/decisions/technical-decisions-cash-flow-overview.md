---
scope_type: phase
related_phases: [9]
status: decided
date: 2026-09-14
scope_description: "Editable actual received/paid amounts on Income and Expense projection entries (mirroring the Investment Timeline's mark-as-Done actualValue pattern), plus a new consolidated Cash Flow Overview screen combining both trackers' projections and monthly Pending/Paid/Received totals."
---

# Technical Decisions — Editable Actual Amounts & Consolidated Cash Flow Overview

_Subprojects in scope:_

- `src/` — single Vue 3 SPA (no separate backend/frontend split in this project); extends the existing income/expense data model (`src/services/incomeCalculations.js`, `src/services/expenseCalculations.js`) and tracker UIs (`src/components/IncomeTracker.vue`, `src/components/ExpenseTracker.vue`), and adds the new overview service/component pair.

---

## TD-01: Actual Amount Storage Shape for Received/Paid Entries

**Scope:** Cross-layer

**Capability:** Extend the Income and Expense trackers' projection entries so that, once an entry is marked Received/Paid, an editable "actual amount" field appears for that entry (defaulting to the expected/registered amount), mirroring the Investment Timeline's mark-as-Done editable `actualValue` pattern. The edited amount persists per entry and feeds the monthly totals in place of the expected amount.

**Context:** Today, `statusOverrides` on each income/expense source is a plain sparse map `{ [month]: 'received' | 'pending' }` (or `'paid' | 'pending'` for expenses) — see `src/services/incomeCalculations.js#L12-L40` and the toggle at `src/components/IncomeTracker.vue#L348-L357`. The Investment Timeline already solved a structurally identical problem: its per-item state is an object `{ checked, actualValue }` (`src/components/InvestmentTimeline.vue#L122-L147`), and it even carries a migration hook for a prior boolean-only shape (`InvestmentTimeline.vue#L122-L126`). Whatever shape is chosen must be read consistently by both trackers and by the new consolidated overview (TD-02), and must not corrupt already-persisted Phase 7/8 data in users' IndexedDB vaults.

**Options:**

### Option A: Upgrade the override value from a string to an object `{ status, actualAmount }`, with a read-time fallback for legacy string values
- Every write sets `statusOverrides[month] = { status: 'received', actualAmount }`; every read checks `typeof value === 'string'` and treats it as `{ status: value, actualAmount: null }` for backward compatibility, exactly mirroring the migration `InvestmentTimeline.vue#L122-L126` already performs for its own shape change.
- **Pros:** Single map remains the one source of truth per entry; reuses a migration pattern already proven and tested in this exact codebase.
- **Cons:** Every existing read site of `statusOverrides` (both trackers, plus the new overview) must be updated to handle both shapes.

### Option B: Keep the string status map unchanged; add a second sparse map `actualAmounts: { [month]: number }`, populated only when status is received/paid
- Two parallel per-source maps instead of one.
- **Pros:** Zero migration needed for existing status data; purely additive.
- **Cons:** Two sparse structures must be kept in sync (e.g., toggling a month back to pending leaves a stale `actualAmounts` entry unless explicitly cleared); every reader now consults two maps instead of one.

### Option C: Keep the actual amount as transient, component-local state only (not persisted), matching `InvestmentTimeline.vue`'s `stateMap` before `saveState()` is considered
- The edited amount lives only in the component's reactive state for the current session.
- **Pros:** No storage schema change at all.
- **Cons:** Directly contradicts the capability's explicit "persists per entry" requirement, and diverges from Timeline's actual behavior — Timeline's `actualValue` **is** persisted via `saveState()` (`InvestmentTimeline.vue#L53`, `@blur="saveState"`), so this option does not, in fact, mirror the referenced pattern.

**Recommendation:** Option A — it mirrors the exact migration approach `InvestmentTimeline.vue` already shipped for its own status-shape upgrade, keeps one map instead of two that could drift out of sync, and is the only option that actually satisfies the "persists per entry" requirement the way Timeline's `actualValue` does.

**Decision:** Option A — Upgrade the override value to `{ status, actualAmount }` with a read-time fallback for legacy string values.

---

## TD-02: Cash Flow Overview Data Composition Strategy

**Scope:** Cross-layer

**Capability:** Add a new consolidated Cash Flow Overview screen presenting Income and Expense projections together in a single month-by-month list, showing each entry's Pending/Paid/Received status and actual amount where applicable, plus monthly aggregate totals for Pending, Paid, and Received across both income and expenses.

**Context:** `IncomeTracker.vue` and `ExpenseTracker.vue` each independently own their `sources` array and call their own `generate*Projection`/`calculateMonthlyTotals` functions, reading persisted data via `repository.getIncome()`/`repository.getExpenses()`. There is currently no shared aggregation point that merges both domains into one list or one set of monthly totals.

**Options:**

### Option A: New `src/services/cashFlowCalculations.js` module that merges both projections and computes combined totals; new `CashFlowOverview.vue` reads sources directly from the repository
- The new service imports `generateIncomeProjection`/`generateExpenseProjection`, tags each entry with `kind: 'income' | 'expense'`, merges and sorts by month, and derives combined per-month Pending/Paid/Received totals. `CashFlowOverview.vue` calls `repository.getIncome()`/`repository.getExpenses()` itself, independent of the other two components' in-memory state.
- **Pros:** Keeps calculation logic in a pure, independently unit-testable service module, matching the pattern every prior tracker phase followed (`financialCalculations.js`, `loanCalculations.js`, `incomeCalculations.js`, `expenseCalculations.js` are all pure modules with their own `.test.js`); the overview stays correct even if the user never opens the individual trackers first.
- **Cons:** The "group entries by month" step already inline in both trackers' `projectionGroups` computed (`IncomeTracker.vue#L314+`) is written a third time in the new service instead of being factored out and shared.

### Option B: `CashFlowOverview.vue` imports both trackers' existing calculation functions directly and does the merge/aggregation inline in the component
- No new service module; the component itself combines the two projections and totals.
- **Pros:** One fewer file.
- **Cons:** Puts merge/aggregation business logic inside a Vue component instead of a pure service module, breaking the separation-of-concerns convention this codebase follows everywhere else (`CLAUDE.md` §Core Directives: "offload calculation, business logic... to pure service modules in `src/services`").

**Recommendation:** Option A — it is the only option that keeps the new aggregation logic in a pure, independently-testable service module, consistent with every prior phase's separation-of-concerns pattern; the minor duplication of the month-grouping step (already accepted as inline-per-component in Phases 7 and 8) is a smaller cost than moving business logic into a component.

**Decision:** Option A — New `cashFlowCalculations.js` service module + `CashFlowOverview.vue` reading sources from the repository directly.

---

## TD-03: Cash Flow Overview Interactivity Scope

**Scope:** Cross-layer

**Capability:** Add a new consolidated Cash Flow Overview screen presenting Income and Expense projections together in a single month-by-month list, showing each entry's Pending/Paid/Received status and actual amount where applicable, plus monthly aggregate totals for Pending, Paid, and Received across both income and expenses.

**Context:** `IncomeTracker.vue` and `ExpenseTracker.vue` already own the status-toggle (`toggleStatus`) and, per TD-01, the actual-amount edit control for their own entries. The capability bullet describes the new screen in terms of "showing" and "presenting... together" rather than editing, but the screen could still duplicate those controls for convenience.

**Options:**

### Option A: Read-only overview — lists entries and totals only; all edits (status toggle, actual amount) happen back in Income Tracker or Expense Tracker
- **Pros:** No duplicated interactive/persistence logic between three components; matches the capability bullet's literal wording; a future change to the toggle/edit UX only needs updating in the two owning trackers.
- **Cons:** A user spotting a wrong entry on the overview must switch tabs to correct it.

### Option B: Fully interactive overview — duplicate the toggle-status control and actual-amount input from both trackers directly in the combined list, each row persisting back through `repository.saveIncome`/`saveExpenses`
- **Pros:** One-stop screen for reviewing and correcting the whole month's cash flow without tab-switching.
- **Cons:** Triplicates interactive UI and persistence-call logic already living in two components, breaking this app's pattern of one component owning one domain's mutations (Income Tracker owns income mutations, Expense Tracker owns expense mutations); any future UX change to the toggle/edit control needs updating in three places.

**Recommendation:** Option A — the capability bullet frames the overview as a presentation surface, and Option B's tripled interactive/persistence surface contradicts this app's established one-component-per-domain-mutation pattern for no capability-mandated benefit.

**Decision:** Option B — Fully interactive overview. Rationale (user): a one-stop screen to review and correct the whole month's cash flow is worth duplicating the toggle/edit controls, despite the added surface area to keep in sync.

---

## Decisions Summary

| ID | Scope | Decision | Recommendation | Choice |
|----|-------|----------|---------------|--------|
| TD-01 | Cross-layer | Actual Amount Storage Shape for Received/Paid Entries | Option A — Upgrade override value to `{status, actualAmount}` with legacy-string fallback | Option A |
| TD-02 | Cross-layer | Cash Flow Overview Data Composition Strategy | Option A — New `cashFlowCalculations.js` service + `CashFlowOverview.vue` reading repository directly | Option A |
| TD-03 | Cross-layer | Cash Flow Overview Interactivity Scope | Option A — Read-only overview | Option B — Fully interactive overview |
