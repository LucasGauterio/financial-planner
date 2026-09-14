---
scope_type: phase
related_phases: [6]
status: decided
date: 2026-09-14
scope_description: "Credit card limit installment scheduling and casual friend loan metrics tracking: remainder rounding, due-date overflow handling, schedule-edit regeneration, and loan lifecycle (archive) management."
---

# Technical Decisions — Loan Tracker & Credit Installment Schedules

_Subprojects in scope:_

- `src/` — single Vue 3 SPA (no separate backend/frontend split in this project); hosts the loan calculation engine (`src/services/loanCalculations.js`), its persistence (`src/services/indexedDbRepository.js`), and the tracker UI (`src/components/LoanTracker.vue`).

---

## TD-01: Installment Remainder Absorption Strategy

**Scope:** Cross-layer

**Capability:** Implement credit card limit installment scheduling (`generateCreditCardInstallments`) and casual friend loan metrics engine.

**Context:** `generateCreditCardInstallments` (`src/services/loanCalculations.js#L15-L59`) splits `totalAmount` into `installmentsCount` equal parts via floored division to two decimals; that floor almost never divides evenly, leaving a fractional-cent remainder that must land somewhere so the sum of all installments equals the original total exactly.

**Options:**

### Option A: Absorb the entire remainder into the last installment
- After computing a flat `baseAmount` for every installment, add the full leftover remainder to installment N only.
- **Pros:** Every installment except the last is a perfectly flat, predictable number; matches the common real-world convention where a final payment differs slightly from the rest.
- **Cons:** The last installment can be visibly larger or smaller than the others, especially for schedules with a big remainder relative to installment size.

### Option B: Distribute the remainder evenly across the first N installments (one extra cent each)
- Add one cent to each of the first `remainder * 100` installments until the leftover is exhausted.
- **Pros:** Differences are smoothed to at most one cent per adjusted installment instead of concentrated in a single row.
- **Cons:** Requires accumulation/loop logic instead of a single closed-form final adjustment; the flat number shown in the schedule stops being perfectly uniform for the whole run.

### Option C: Absorb the entire remainder into the first installment
- Same simplicity as Option A, but the adjustment lands on installment 1 instead of the last.
- **Cons:** Front-loads the discrepancy against the "estimated installment" preview shown in the add/edit form (`form.totalAmount / form.installmentsCount`, `LoanTracker.vue#L267-L270`), which matches the flat middle value, not a bumped first payment — so the first row generated would visibly disagree with what the form just previewed.

**Recommendation:** Option A — it keeps the form's "estimated installment" preview consistent with every generated row except the last, and mirrors the everyday "final payment adjusts" convention users already expect from real credit card statements.

**Decision:** Option A — Absorb the entire remainder into the last installment.

---

## TD-02: Due-Day-of-Month Overflow Handling

**Scope:** Cross-layer

**Capability:** Implement credit card limit installment scheduling (`generateCreditCardInstallments`) and casual friend loan metrics engine.

**Context:** The user-supplied `dueDay` (1–31, `LoanTracker.vue#L257-L259`) does not exist in every month (e.g., day 31 in June, day 30 in February). `generateCreditCardInstallments` must pick a concrete due date for each generated month regardless.

**Options:**

### Option A: Clamp the day down to the last valid day of that month
- `actualDay = Math.min(dueDay, maxDaysInMonth)` (`loanCalculations.js#L36-L37`) — a due day of 31 becomes the 28th/29th/30th in short months.
- **Pros:** The due date always falls inside the month the installment was generated for, preserving the loop's "installment i belongs to month i" invariant (`curMonth = month - 1 + i`); matches how real billing cycles behave ("same day, or end of month if unavailable").
- **Cons:** The nominal day-of-month isn't perfectly constant across the schedule for short months.

### Option B: Roll the overflow into the next month
- A due day of 31 in a 30-day month becomes the 1st of the following month.
- **Cons:** Breaks the schedule's month-per-installment mapping the generation loop relies on — an installment's due date could land outside the month it was indexed for, and this doesn't match how billing statements actually work.

### Option C: Reject due days above 28 at input time
- Restrict the form's `dueDay` input to 1–28, sidestepping the ambiguity entirely.
- **Cons:** Arbitrarily disallows legitimate due days (29–31) that are valid for most months of the year, over-constraining the form for a corner case affecting only a few months.

**Recommendation:** Option A — clamping is the only option that preserves the generation loop's month-per-installment invariant while matching the everyday expectation of a billing due date, without over-restricting valid input.

**Decision:** Option A — Clamp the day down to the last valid day of the month.

---

## TD-03: Schedule Regeneration on Parameter Edit

**Scope:** Cross-layer

**Capability:** Implement credit card limit installment scheduling (`generateCreditCardInstallments`) and casual friend loan metrics engine.

**Context:** `updateExistingLoan` (`LoanTracker.vue#L666-L694`) detects whether `totalAmount`, `installmentsCount`, `startMonth`, or `dueDay` changed for an existing credit loan. When they have, it re-runs `generateCreditCardInstallments` and replaces the entire `installments` array, which discards any `paid` statuses and `paymentDate`s already recorded on the old schedule — guarded only by a `confirm()` dialog (`t('loans.confirmAlterParams')`).

**Options:**

### Option A: Full regenerate, gated by a confirm dialog
- Treat the four schedule parameters as the single source of truth; any change re-derives the whole `installments` array from scratch after the user confirms.
- **Pros:** The schedule is always internally consistent with its parameters — no risk of a partially-merged, self-contradictory array; simple, deterministic function of four inputs.
- **Cons:** Payment history recorded before the edit is destroyed if the user confirms (recoverable only by cancelling the dialog and not editing).

### Option B: Preserve installments by number where possible, regenerating only unmatched/new entries
- Match existing installments to the new schedule by installment number and keep their `status`/`paymentDate` when the number still exists.
- **Cons:** Installment "identity" across a parameter edit is ambiguous — if `startMonth` shifts or `installmentsCount` shrinks/grows, it's unclear which old installment corresponds to which new one, making a naive number-match merge produce dates/amounts that no longer line up with what was actually paid.

### Option C: Disallow parameter edits once any installment is marked paid
- Only `notes`/`cardName` remain editable after the first payment; `totalAmount`/`installmentsCount`/`startMonth`/`dueDay` become read-only.
- **Cons:** Removes any path to correct a genuine data-entry mistake (wrong amount, wrong start month) after the first payment — the user would have to delete and recreate the loan, losing the same history anyway.

**Recommendation:** Option A — the `confirm()` guard already surfaces the destructive consequence before it happens, which is a reasonable trade for keeping schedule generation a single deterministic function of its parameters rather than introducing installment-identity-preserving merge logic that Option B would require.

**Decision:** Option A — Full regenerate, gated by a confirm dialog.

---

## TD-04: Loan Type Data Model — Unified Collection with Type Discriminator

**Scope:** Cross-layer

**Capability:** Implement credit card limit installment scheduling (`generateCreditCardInstallments`) and casual friend loan metrics engine.

**Context:** `indexedDbRepository.js#L272-L273` exposes a single `LOANS_KEY` blob (`getLoans`/`saveLoans`) holding every loan regardless of kind. Each stored loan carries a `type: 'casual' | 'credit'` field plus type-specific properties (`amountLent`/`payments` vs. `totalAmount`/`installments`/`dueDay`/`startMonth`/`cardName`), and `LoanTracker.vue` branches on `loan.type` throughout (summaries, filters, form fields, drawer content).

**Options:**

### Option A: Single array with a `type` discriminator field
- One persistence key, one save/load call, and one combined list feeding the stats dashboard and filter tabs for both loan kinds.
- **Pros:** Matches the one-key-per-domain convention already used for every other repository entry (investments, goals, timeline, income); the combined stats/filters work against one list with no merge step.
- **Cons:** Every consumer (UI, summary functions) must branch on `type` to know which fields are valid.

### Option B: Two separate repository keys/collections (e.g. `CASUAL_LOANS_KEY`, `CREDIT_LOANS_KEY`)
- Each collection's shape is homogeneous; no `type` branching needed within a collection.
- **Cons:** Breaks from `indexedDbRepository.js`'s established exactly-one-key-per-capability pattern, needs two save/load calls kept in sync, and the unified stats dashboard / mixed filter tabs (`active`/`completed`/`archived`/`all` spanning both types) would still need to merge two lists to render.

### Option C: Single array, loan kind inferred structurally from which fields are present (no `type` field)
- Saves one field by duck-typing the kind from the shape of the object.
- **Cons:** Fragile inference throughout the codebase for a value that's read explicitly in nearly every conditional branch (`v-if="loan.type === 'casual'"`) — an explicit discriminator is strictly safer for the same cost.

**Recommendation:** Option A — it matches this app's established one-key-per-domain repository convention and lets the stats dashboard and combined filter tabs operate on one list, at the cost of type-branching the UI needs regardless since casual and credit loans render genuinely different sections.

**Decision:** Option A — Single array with a `type` discriminator field.

---

## TD-05: Loan Lifecycle Visibility — Archive Flag vs. Deletion

**Scope:** Cross-layer

**Capability:** Implement credit card limit installment scheduling (`generateCreditCardInstallments`) and casual friend loan metrics engine.

**Context:** A loan never functionally expires — a fully-paid credit schedule or an inactive friend loan should stop cluttering the primary view without losing its history. The implementation adds an `archived: boolean` field (toggled via `toggleArchive`, `LoanTracker.vue#L766-L773`); `filteredLoans` and the aggregate `stats` exclude archived loans from the default view and totals, a dedicated `archived` filter tab surfaces them again, and a separate hard `deleteLoan` action remains available regardless of archive state.

**Options:**

### Option A: Soft-hide via `archived` boolean, with a separate hard delete
- Declutter without losing history; permanent removal stays a distinct, intentional action.
- **Pros:** Users can hide completed/inactive loans from the active view while keeping their payment/installment history intact and inspectable via the `archived` filter tab; hard delete is still available when a loan should truly be gone.
- **Cons:** Adds a field and a filter dimension beyond the `completed` status already derived from `remainingBalance === 0`.

### Option B: Rely solely on the existing `completed` filter (`remainingBalance === 0`)
- No extra field or action.
- **Cons:** Cannot hide a loan the user wants to stop tracking while its balance is still outstanding (e.g., a friend loan being written off) — `completed` reflects payoff status only, not the user's intent to declutter.

### Option C: Hard delete only, no archive state
- Simplest model, one fewer lifecycle state.
- **Cons:** The only way to declutter a finished or abandoned loan is to permanently erase it, destroying the payments ledger / installment history that `calculateCasualLoanSummary`/`calculateCreditLoanSummary` and the details drawer are built to preserve.

**Recommendation:** Option A — it's the only option that lets users declutter their primary view independently of payoff status without discarding history, while keeping hard deletion available as a distinct action for loans the user genuinely wants removed.

**Decision:** Option A — Soft-hide via `archived` boolean, with a separate hard delete.

---

## Decisions Summary

| ID | Scope | Decision | Recommendation | Choice |
|----|-------|----------|---------------|--------|
| TD-01 | Cross-layer | Installment Remainder Absorption Strategy | Option A — Absorb remainder into last installment | Option A |
| TD-02 | Cross-layer | Due-Day-of-Month Overflow Handling | Option A — Clamp to last valid day of month | Option A |
| TD-03 | Cross-layer | Schedule Regeneration on Parameter Edit | Option A — Full regenerate, gated by confirm dialog | Option A |
| TD-04 | Cross-layer | Loan Type Data Model | Option A — Single array with `type` discriminator | Option A |
| TD-05 | Cross-layer | Loan Lifecycle Visibility | Option A — Archive flag + separate hard delete | Option A |
