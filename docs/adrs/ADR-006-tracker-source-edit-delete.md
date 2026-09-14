# ADR-006: Income/Expense Source Edit & Delete — Reuse of Loan Tracker Interaction Pattern

- **Status**: Accepted
- **Date**: 2026-09-14
- **Deciders**: Core Engineering Team
- **Related decisions**: ADR-004 (Expense Tracker Persistence & Projection Layer — Reuse of Income Tracker Pattern), ADR-005 (Recurring Expense End Date), [Technical Decisions — Edit & Delete for Income/Expense Sources](../decisions/technical-decisions-tracker-source-edit-delete.md)

---

## Context and Problem Statement

Neither `IncomeTracker.vue` (Phase 7) nor `ExpenseTracker.vue` (Phase 8) exposes any way to modify or remove a registered source after creation — only "add" and a per-month status toggle exist. [`LoanTracker.vue`](../../src/components/LoanTracker.vue#L605-L764) already solved the equivalent problem for loans: a populated-modal edit flow keyed by an id field on `form`, and a dedicated confirm-modal delete flow. The question is whether income/expense sources should adopt that same interaction pattern, and — since income/expense sources carry a `statusOverrides` map with no positional equivalent in the loan model — how editing a source's recurrence parameters should treat previously-recorded month statuses.

---

## Decision

Per [technical-decisions-tracker-source-edit-delete.md](../decisions/technical-decisions-tracker-source-edit-delete.md):

1. **Edit mechanism (TD-01, Option A)** — both trackers gain an `editSource(source)` function that populates `form` (keyed by `form.sourceId`) and reopens the existing add/edit modal, mirroring [`editLoan`](../../src/components/LoanTracker.vue#L605-L619). `saveSource()` branches on `form.sourceId` presence to update-in-place vs. push-new, mirroring [`saveLoan`](../../src/components/LoanTracker.vue#L730-L745).
2. **Delete mechanism (TD-01, Option A)** — both trackers gain a dedicated confirm modal (`showDeleteConfirm` + a `sourceToDelete` ref) before filtering the source out of the array and persisting, mirroring [`deleteLoan`/`confirmDeleteLoan`](../../src/components/LoanTracker.vue#L747-L764). No native `window.confirm()` is used for delete, consistent with the loan tracker's own choice of a themed modal over the browser-native dialog.
3. **Status-override handling on edit (TD-02, Option B)** — when an edit changes `startMonth`, `recurring`, or `endMonth`, `statusOverrides` is reset to `{}` after a native `confirm()` warning, mirroring [`updateExistingLoan`'s parameter-change guard](../../src/components/LoanTracker.vue#L677-L694). Editing only `name`, `type`, or `amount` does not trigger this reset (those fields don't affect which months are generated).

---

## Considered Alternatives

### Alternative A: Inline row editing instead of a populated modal
- **Rejected** — introduces a new interaction pattern with no precedent elsewhere in the app; every other edit flow in this codebase (loans) is modal-based.

### Alternative B: Native `window.confirm()` for delete instead of a dedicated modal
- **Rejected** — inconsistent with `LoanTracker.vue`'s own delete flow, which deliberately uses a themed modal rather than the unstyled native dialog; a destructive, irreversible action warrants the more deliberate on-brand step already established.

### Alternative C: Preserve `statusOverrides` unconditionally on any edit (no discard, no confirm)
- **Rejected by user decision** — the research recommendation favored this (orphaned map entries are harmless and invisible), but the user chose consistency with the established loan-tracker precedent for parameter-changing edits over the marginal typo-risk trade-off; the confirm-dialog gate mitigates accidental data loss.

---

## Consequences

### Positive
- Every edit/delete flow in the app (loans, income, expenses) now shares one consistent interaction pattern — no new UI paradigm for a user or future contributor to learn.
- Implementation cost is minimal: the add modal and `form` reactive object already exist in both trackers; only a populate-on-open branch, a delete-confirm modal, and a parameter-change guard are new.

### Negative
- Editing a recurring source's `startMonth`/`recurring`/`endMonth` discards all recorded paid/received statuses for that source (gated by a confirm warning) — a user who only meant to fix a date typo loses their manually-confirmed history for that source and must re-confirm past months. This is an accepted trade-off (user decision) favoring consistency with the loan precedent over data preservation.

---

## References
- [ADR-004 — Expense Tracker Persistence & Projection Layer — Reuse of Income Tracker Pattern](ADR-004-expense-tracker-pattern-reuse.md)
- [ADR-005 — Recurring Expense End Date — Bounded Divergence from the Income Tracker Pattern](ADR-005-expense-recurring-end-date.md)
- [`src/components/LoanTracker.vue`](../../src/components/LoanTracker.vue#L605-L764)
- [Technical Decisions — Edit & Delete for Income/Expense Sources](../decisions/technical-decisions-tracker-source-edit-delete.md)
