---
scope_type: ad-hoc
related_phases: [7, 8]
status: decided
date: 2026-09-14
scope_description: "Edit and delete capability for registered income/expense sources — today IncomeTracker.vue and ExpenseTracker.vue only support adding a source and toggling a month's status; there is no way to modify or remove a source once created."
---

# Technical Decisions — Edit & Delete for Income/Expense Sources

_Subprojects in scope:_

- `src/` — single Vue 3 SPA (no separate backend/frontend split in this project); extends `src/components/IncomeTracker.vue`, `src/components/ExpenseTracker.vue`, and their respective calculation modules' consumers.

---

## TD-01: Edit & Delete UI Mechanism

**Scope:** Cross-layer

**Capability:** Transversal — covers: "Register income sources (salary, dividends, received payments), each optionally flagged as recurring; generate a month-by-month projection list (received vs. pending) with monthly totals, projectable up to 35 years." (Phase 7) and "Register expense sources (fixed bills, variable spending, subscriptions), each optionally flagged as recurring and optionally given an end date for bounded-term recurring sources; generate a month-by-month projection list (paid vs. pending) with monthly totals, projectable up to 35 years, mirroring the income tracker's data model." (Phase 8)

**Context:** Neither `IncomeTracker.vue` nor `ExpenseTracker.vue` exposes any way to modify or remove a registered source after creation — a typo in the name, a wrong amount, or a source that no longer applies has no correction path other than manually editing browser-stored data. [`LoanTracker.vue`](../../src/components/LoanTracker.vue#L605-L619) already solved this exact problem for loans: `editLoan(loan)` populates the existing add-modal's form fields (keyed by `form.loanId`) and reopens it; [`saveLoan()`](../../src/components/LoanTracker.vue#L730-L745) branches on `form.loanId` presence to update-in-place vs. push-new; `deleteLoan(loan)` ([`L747-L764`](../../src/components/LoanTracker.vue#L747-L764)) opens a dedicated confirm modal (`showDeleteConfirm` + `loanToDelete`) before filtering the loan out of the array and persisting.

**Options:**

### Option A: Reuse the LoanTracker pattern verbatim (populated add-modal for edit, dedicated confirm modal for delete)
- An edit button on each source row calls `editSource(source)`, which populates `form` (keyed by `form.sourceId`) and reopens the existing add/edit modal; `saveSource()` branches on `form.sourceId` to update-in-place vs. push-new. A delete button opens a small dedicated confirm modal (mirroring `showDeleteConfirm`/`loanToDelete`) before filtering the source out and persisting.
- **Pros:** Zero new UI pattern in the app — a user who already knows how to edit/delete a loan immediately knows how to edit/delete an income or expense source; the add modal's fields are already exactly the fields that need to be editable.
- **Cons:** None significant — the modal already exists and just needs a populate-on-open branch, same as loans.

### Option B: Inline row editing (fields become editable directly in the projection list, no modal) + native `confirm()` for delete
- Clicking "edit" turns the source's row into editable inputs in place; delete uses the browser's native `confirm()` dialog.
- **Pros:** Fewer clicks for a quick fix (no modal open/close).
- **Cons:** Introduces a new interaction pattern not used anywhere else in the app (every other edit flow in this codebase is modal-based); native `confirm()` is unstyled and inconsistent with the app's dark theme, and `LoanTracker.vue`'s delete flow deliberately avoided it in favor of a themed modal.

### Option C: Reuse the add modal for edit (as in Option A), but use native `window.confirm()` for delete instead of a dedicated modal
- Same edit mechanism as Option A; delete skips the custom confirm modal and uses `window.confirm()` directly (this is actually how `LoanTracker.vue` gates its *parameter-change* warning inside `updateExistingLoan` — [`L682-L690`](../../src/components/LoanTracker.vue#L682-L690) — as opposed to its *delete* flow, which uses the themed modal).
- **Pros:** Less code than a dedicated modal (no `showDeleteConfirm` state, no separate template block).
- **Cons:** Inconsistent with `LoanTracker.vue`'s own delete flow (which does use a themed modal, not `window.confirm()`) and with the app's otherwise fully custom-styled UI; a destructive, irreversible action (delete) deserves the more deliberate, on-brand confirm step already established for loans.

**Recommendation:** Option A — it introduces no new interaction pattern (every edit/delete flow in the app becomes visually and behaviorally consistent), and the implementation cost is minimal since the add modal and its `form` reactive object already exist in both trackers; this exactly mirrors `LoanTracker.vue`'s already-proven `editLoan`/`saveLoan`/`deleteLoan`/`confirmDeleteLoan` shape.

**Decision:** Option A — Reuse the LoanTracker pattern verbatim (populated add-modal for edit, dedicated confirm modal for delete).

---

## TD-02: Status-Override Handling When a Source Is Edited

**Scope:** Cross-layer

**Capability:** Transversal — covers: "Register income sources (salary, dividends, received payments), each optionally flagged as recurring; generate a month-by-month projection list (received vs. pending) with monthly totals, projectable up to 35 years." (Phase 7) and "Register expense sources (fixed bills, variable spending, subscriptions), each optionally flagged as recurring and optionally given an end date for bounded-term recurring sources; generate a month-by-month projection list (paid vs. pending) with monthly totals, projectable up to 35 years, mirroring the income tracker's data model." (Phase 8)

**Context:** Each income/expense source carries a sparse `statusOverrides` map keyed by `"YYYY-MM"` (per `monthly-income-tracker/TD-01`, inherited by Phase 8), independent of `startMonth`/`recurring`/`endMonth`. `LoanTracker.vue`'s precedent for editing a *credit* loan's schedule parameters is to fully regenerate the materialized `installments` array and discard any recorded payment status, gated by a native `confirm()` warning ([`updateExistingLoan`, L677-L694](../../src/components/LoanTracker.vue#L677-L694)) — but that precedent exists because a credit loan's installments are a *materialized, positionally-indexed* array (changing the count/start/amount genuinely invalidates which installment is which). Income/expense sources are structurally different: `statusOverrides` is keyed by calendar month string, not by array position, so the question of whether editing `startMonth`/`recurring`/`endMonth` should discard, preserve, or attempt to remap existing overrides is a distinct decision, not a direct inheritance from the loan precedent.

**Options:**

### Option A: Preserve `statusOverrides` as-is on any edit; unreferenced entries simply go unused
- Editing a source's `startMonth`, `recurring`, or `endMonth` never touches `statusOverrides`. If the edit causes some previously-overridden months to fall outside the newly-generated projection, those map entries become inert (never read by `generateIncomeProjection`/`generateExpenseProjection`, since lookup is keyed by currently-generated months only) but are not deleted.
- **Pros:** Zero risk of silently discarding a user's manually-confirmed received/paid marks; no extra logic in `saveSource`; no confirm-before-edit dialog needed at all (edit is a plain save, unlike loans).
- **Cons:** The map can accumulate a small number of orphaned entries over repeated edits — harmless (bounded by the number of times a user edits a single source) but not self-cleaning.

### Option B: Discard `statusOverrides` entirely whenever `startMonth`, `recurring`, or `endMonth` changes, gated by a confirm dialog (mirrors the loan precedent)
- Any edit touching those three fields wipes `statusOverrides` to `{}` after a `confirm()` warning, matching `updateExistingLoan`'s pattern for credit loans.
- **Pros:** Consistent with the loan precedent's caution around parameter changes; guarantees no stale override survives a structural edit.
- **Cons:** Punishes the common case unnecessarily — e.g., fixing a typo in `startMonth` (a date picker mis-click) would silently erase every month the user had already marked received/paid, with no way to recover them; the loan precedent's rationale (positionally-indexed materialized array) does not apply here, since overrides are keyed by calendar month, not position.

### Option C: Remap on edit — keep only the `statusOverrides` entries whose month key still falls within the newly-generated projection range, discard the rest silently
- On save, recompute which months the edited source would generate and filter `statusOverrides` to just those keys.
- **Pros:** Keeps the map tidy (no orphaned entries).
- **Cons:** Adds a projection-derivation dependency inside the save path (must call `generateIncomeProjection`/`generateExpenseProjection` at save time just to compute the valid key set) for a cosmetic benefit only — Option A's orphaned entries are already invisible and harmless; silent discarding (even of only out-of-range entries) still risks losing a user's manually-confirmed status without any warning, for marginal gain over Option A.

**Recommendation:** Option A — orphaned map entries are invisible and harmless (never surfaced in the UI, never affect totals), while both alternatives introduce a real risk of silently or semi-silently discarding a user's manually-confirmed received/paid history for a class of edits (fixing a date typo) that has nothing to do with the loan precedent's justification (positional materialized-array invalidation); Option A also needs no confirm-before-edit dialog, keeping the edit flow as simple as the add flow.

**Decision:** Option B — Discard `statusOverrides` entirely whenever `startMonth`, `recurring`, or `endMonth` changes, gated by a confirm dialog. Rationale (user): consistency with the established `LoanTracker.vue` precedent for parameter edits outweighs the typo-risk trade-off; the confirm-dialog gate mitigates accidental data loss.

---

## Decisions Summary

| ID | Scope | Decision | Recommendation | Choice |
|----|-------|----------|---------------|--------|
| TD-01 | Cross-layer | Edit & Delete UI Mechanism | Option A — Reuse LoanTracker's populated-modal edit + dedicated confirm-modal delete | Option A |
| TD-02 | Cross-layer | Status-Override Handling When a Source Is Edited | Option A — Preserve overrides as-is; orphaned entries are harmless | Option B — Discard on parameter change, gated by confirm |
