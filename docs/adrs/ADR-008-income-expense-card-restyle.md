# ADR-008: Income/Expense Tracker Card & Drawer Restyle — Reuse of Loan Tracker Visual Pattern

- **Status**: Accepted
- **Date**: 2026-09-14
- **Deciders**: Core Engineering Team
- **Related decisions**: ADR-003 (Loan Tracker Persistence & Calculation Layer — Reuse of Established Patterns), ADR-004 (Expense Tracker Persistence & Projection Layer — Reuse of Income Tracker Pattern), ADR-007 (Editable Actual Amounts & Consolidated Cash Flow Overview)

---

## Context and Problem Statement

`IncomeTracker.vue` (Phase 7) and `ExpenseTracker.vue` (Phase 8) render registered sources as a flat always-visible row list (`.income-entry-row` / `.expense-entry-row`, one row per source, edit/delete icons always shown), followed by a single combined month-by-year projection list spanning every registered source at once. `LoanTracker.vue` ([`src/components/LoanTracker.vue#L1-L1681`](../../src/components/LoanTracker.vue#L1-L1681)) already solved a structurally similar problem — many registered items, each with its own status history to review — with a different, more visually developed pattern: a stats dashboard row (`.stats-grid` of `.stat-card`s), registered items as a card grid (`.loans-grid` of `.loan-card`s, hover-revealed `.card-actions` for edit/archive/delete), and a per-item detail drawer (`.drawer-overlay`/`.drawer-panel`, a `Teleport`-based slide-in panel opened by clicking a card) that shows that one item's own history (payment ledger or installment schedule) in isolation. Per [`ui-pattern-consistency.md`](../../.claude/rules/ui-pattern-consistency.md), a new or reworked screen should read the conventions of an existing sibling before introducing or keeping a divergent pattern — this ADR records the decision to adopt the Loan Tracker's already-proven pattern for Income and Expense instead of continuing to diverge from it.

No new technical-decisions document was produced for this phase: the target pattern is not a new architectural choice with competing alternatives — it is a fully specified, already-shipped sibling component. Per the `/research` skill's skip criteria, the three points of the restyle that were genuinely open (whether per-source projections move into a drawer or stay combined, whether to add a stats dashboard, and whether the new Cash Flow Overview screen from Phase 9 should also be restyled) were resolved directly with the user rather than through a decisions document, mirroring how ADR-004/ADR-005 treated Phase 8's core capability as inheriting Phase 7's decisions.

---

## Decision

1. **Per-source detail drawer (user decision)** — each registered source's own month-by-month projection (status toggle + actual-amount editing, per [ADR-007](ADR-007-cash-flow-overview.md)) moves into a `Teleport`-based slide-in drawer opened by clicking that source's card, mirroring [`LoanTracker.vue`'s `showDetailsDrawer`/`selectedLoan`](../../src/components/LoanTracker.vue#L296-L440) pattern exactly. The single combined list spanning every source at once is removed from `IncomeTracker.vue`/`ExpenseTracker.vue`. The horizon selector (1/5/10/35 years) remains a top-level control — it drives both the stats dashboard and whichever drawer is currently open, since (unlike a loan's fixed installment count) an income/expense source's projection length has no natural bound of its own.
2. **Stats dashboard row (user decision)** — both trackers gain a `.stats-grid` row mirroring [`LoanTracker.vue`'s `stats` computed](../../src/components/LoanTracker.vue#L547-L572): Income shows total expected / received / pending (summed across the selected horizon) plus a registered-sources count; Expense shows the same with paid in place of received.
3. **Card grid for registered sources** — the always-visible source row list is replaced by a `.loans-grid`-equivalent card grid (hover-revealed `.card-actions` for edit/delete, matching [`LoanTracker.vue#L79-L149`](../../src/components/LoanTracker.vue#L79-L149)), one card per source, clicking anywhere on the card (outside the action icons) opens that source's detail drawer.
4. **No filter tabs, no archive/lifecycle state** — `LoanTracker.vue`'s `active`/`completed`/`archived`/`all` filter tabs are **not** adopted: income/expense sources have no equivalent lifecycle concept (a loan's "completed"/"archived" states track debt payoff and manual decluttering, which does not map onto a recurring income or expense source). Adopting filter tabs here would be inventing a capability the user did not ask for.
5. **Cash Flow Overview is out of scope (user decision)** — `CashFlowOverview.vue` (Phase 9) keeps its current merged list-based layout unchanged; this restyle touches only `IncomeTracker.vue` and `ExpenseTracker.vue`.
6. **Add/Edit modal and delete/param-change `ConfirmDialog`s are unchanged** — both trackers already use the same `.modal-overlay`/`.modal-content` shape and `ConfirmDialog.vue` that `LoanTracker.vue` uses; no restyle is needed there.

---

## Considered Alternatives

### Alternative A: Keep the single combined projection list, restyle only the registered-sources row into cards
- **Rejected by user decision** — this would only be a cosmetic restyle of the registration list, leaving the projection browsing experience (the part of the screen a user interacts with most) unchanged and still diverging from the Loan Tracker's per-item drawer pattern.

### Alternative B: Add `LoanTracker.vue`'s filter-tabs (active/completed/archived/all) to Income/Expense as well, for full visual parity
- **Rejected** — income/expense sources have no lifecycle state a filter could meaningfully partition on; adding one would require inventing a capability (e.g., an "archive a source" action) that was never requested and has no product justification.

### Alternative C: Restyle `CashFlowOverview.vue` to the card grid as well, for total consistency across all three screens
- **Rejected by user decision** — Cash Flow Overview's value is precisely that it is a single combined, scannable list across both domains; converting it to a per-entry card grid would work against that purpose. Deferred, not part of this phase.

---

## Consequences

### Positive
- All three source-heavy trackers (Loan, Income, Expense) now share one visual and interaction language — a user who knows how to work with loans immediately knows how to work with income/expense sources.
- The stats dashboard gives an at-a-glance summary that the current flat list does not provide.

### Negative
- Reviewing multiple sources' projections side by side (previously possible in the single combined list, e.g. "what's my total pending across every source this month") now requires opening one drawer at a time per source; the combined month-level view still exists, but only in the separate Cash Flow Overview screen (Phase 9), not inside Income/Expense Tracker itself.
- The horizon selector's meaning shifts slightly: it no longer directly renders a visible list at the top level (since that list is removed), only feeding the stats dashboard and whichever drawer happens to be open — a user must open a drawer to see the effect of changing the horizon on a specific source's projection.

---

## References
- [ADR-003 — Loan Tracker Persistence & Calculation Layer — Reuse of Established Patterns](ADR-003-loan-tracker-pattern-reuse.md)
- [ADR-004 — Expense Tracker Persistence & Projection Layer — Reuse of Income Tracker Pattern](ADR-004-expense-tracker-pattern-reuse.md)
- [ADR-007 — Editable Actual Amounts & Consolidated Cash Flow Overview](ADR-007-cash-flow-overview.md)
- [`src/components/LoanTracker.vue`](../../src/components/LoanTracker.vue#L1-L1681)
- [`.claude/rules/ui-pattern-consistency.md`](../../.claude/rules/ui-pattern-consistency.md)
