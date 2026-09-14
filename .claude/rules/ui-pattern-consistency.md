# Rule: Explore Existing Screens Before Building a New One (ui-pattern-consistency)

The app has no design-system library — visual consistency across trackers/calculators exists only because each new screen was built by copying the conventions of an existing one. Skipping that step produces a screen that looks and behaves differently from the rest of the app.

## Directives
1. **Explore before building**: before implementing a new screen or component, read at least one existing sibling component of the same kind (a tracker looking at another tracker, a calculator at another calculator) to identify its layout and interaction conventions.
2. **Reuse, don't reinvent**, at minimum:
   - Section header shape (`.section-header` with title + subtitle + primary action button).
   - Metric/summary row shape (`.grid-2` of `.metric` blocks).
   - Empty-state shape (`.card.empty-state`).
   - List/row shape for repeated items (`entry-info` / `entry-right` / `entry-amount`, or the loan-card shape for richer items).
   - Add/edit modal shape (`Teleport to="body"` → `.modal-overlay` → `.modal-content` → `.modal-header` / `.modal-body` with `.form-fieldset` groups / `.modal-footer`).
   - Action icon buttons (`.action-icon-btn`, `.action-icon-btn.danger`) for edit/delete affordances.
   - i18n key structure (`<domain>.title`, `<domain>.form.*`, `<domain>.status.*`, mirrored 1:1 between `en-US.js` and `pt-BR.js`).
3. **Deviate only with a reason**: a new visual pattern is acceptable when the existing ones genuinely don't fit the new screen's need — not by default. Note the reason inline (a short comment or, for a non-obvious deviation worth remembering across sessions, a decision recorded via the project's research/decision flow).
