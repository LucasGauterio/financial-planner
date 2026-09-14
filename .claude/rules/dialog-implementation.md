# Rule: Dialogs Are Vue Components, Explicit Dismissal Only (dialog-implementation)

Every dialog in this app — confirmation, warning, or informational — is a first-class UI element, not a browser primitive. Consistency here is what makes the app feel native rather than like a patchwork of native `confirm()`/`alert()` popups and custom modals.

## Directives
1. **No Native Browser Dialogs**: Never use `window.confirm()`, `window.alert()`, `window.prompt()`, or any other native browser dialog. Every confirmation, warning, or prompt MUST be a Vue component, following the app's existing modal pattern: `Teleport to="body"` + `.modal-overlay` + `.card.modal-content` (see `LoanTracker.vue`'s delete-confirm modal for the canonical shape).
2. **Explicit Dismissal Only**: A dialog MUST NOT close by clicking outside the overlay, pressing Escape, or any other implicit dismissal. It closes only through an explicit action on one of its own buttons — Close (`&times;`), Cancel, or Confirm/Save/Delete. Do not attach `@click.self="close...”` (or equivalent) handlers to `.modal-overlay` elements, and do not wire a global `keydown.esc` listener to close a dialog.
3. **Applies to warnings inside a flow, not just standalone dialogs**: a warning that currently uses `confirm(...)` to gate a destructive or data-clearing action (e.g., a parameter edit that clears recorded history) must be converted to its own dialog component with explicit Cancel/Continue buttons — the gate itself does not get to bypass Directive 1.

## Reference implementation

`src/components/ConfirmDialog.vue` is the canonical confirmation dialog — props `show` / `title` / `message` / `confirmText` / `cancelText` / `danger`, emits `confirm` / `cancel`, no `@click.self` on its overlay. Reuse it for any new confirmation instead of hand-rolling another `.modal-overlay` + warning-icon block.

## Retrofit history (completed 2026-09-14)

Every pre-existing violation was migrated to `ConfirmDialog.vue` (or, for pure informational alerts with no confirm/cancel semantics, to an inline error message reusing the component's existing status-banner convention):

- `LoanTracker.vue` — `confirm(...)` in the credit-loan parameter-change guard → `ConfirmDialog` (`showParamsConfirm`); delete-confirm modal → `ConfirmDialog`; details drawer's click-outside removed.
- `IncomeTracker.vue` / `ExpenseTracker.vue` — `confirm(...)` in the parameter-change guard → `ConfirmDialog` (`showParamsConfirm`); delete-confirm modal → `ConfirmDialog`; add/edit modal's click-outside removed.
- `PortfolioTracker.vue` — two `alert(...)` validation calls → inline `formError` message near the form footer; delete-confirm modal → `ConfirmDialog`; edit drawer's click-outside removed.
- `BackupManager.vue` — `confirm(...)` before restoring a snapshot → `ConfirmDialog` (`showRestoreConfirm`); two `alert(...)` error calls → reused the existing `importMsg` inline status banner.
- `LockScreen.vue` — `confirm(...)` before deleting a profile → `ConfirmDialog` (`showDeleteProfileConfirm`); privacy modal's click-outside removed.

No known violations remain. Any new dialog must ship compliant from the start — that's what Directives 1–3 above are for.
