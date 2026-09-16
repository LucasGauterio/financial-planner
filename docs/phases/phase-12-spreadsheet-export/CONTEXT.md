---
kind: phase
name: phase-12-spreadsheet-export
sources_mtime:
  docs/project-plan.md: "2026-09-16T11:23:58"
  docs/decisions/technical-decisions-spreadsheet-export.md: "2026-09-16T12:32:30"
  docs/phases/phase-12-spreadsheet-export/library-refs.md: "2026-09-16T12:33:14"
---

# phase-12-spreadsheet-export — Context

## Scope

**Phase name:** Spreadsheet Data Export

**Capabilities** (literal, `docs/project-plan.md`):

- Add a data-export capability that consolidates every tracked domain — Income sources & projections, Expense sources & projections, Loan Tracker entries & schedules, Portfolio Tracker holdings, Cash Flow Overview, and Investment Timeline entries — into a downloadable spreadsheet file, one sheet/tab per domain, exposed via a new dedicated Data Export screen.

**Out of scope:** Per-domain/zipped export files, a user-selectable export subset, and password-protected/encrypted export output — deferred, see `docs/PRD.md` § Out of Scope / Deferred Items and `docs/RFC.md` § Open Questions / Future Roadmap.
**Deliverables:** Target files: [`src/components/BackupManager.vue`](../../../src/components/BackupManager.vue#L1-L100) (reference existing export screen pattern), `src/components/DataExport.vue` (new), `src/services/spreadsheetExportService.js` (new), `src/App.vue` (new nav entry).
**Affected subprojects:** _None explicitly mentioned — single-repo Vue 3 SPA (no subproject split exists in this project)._
**Deferred subprojects:** _None._
**Sequencing notes:** _None specified._ Phase 12 is the last phase currently defined in `docs/project-plan.md`.

**Neighbors (for boundary detection only):**

- **Phase 11:** Full Dependency & Runtime Upgrade — a maintenance/security-hygiene phase (dependency + Node runtime bumps), unrelated in substance to this phase's UI/data-export scope.
- **Phase 13:** _No phase 13 defined — Phase 12 is the last phase in `docs/project-plan.md`._

## Decisions Index

_(from `docs/decisions/technical-decisions-spreadsheet-export.md` — the only decisions doc tied to phase 12; no ad-hoc doc has `12` in `related_phases`)_

| Ref | Source | Scope | Topic | Status | Decision | Libraries |
|-----|--------|-------|-------|--------|----------|-----------|
| spreadsheet-export/TD-01 | phase | Cross-layer | Spreadsheet Generation Library | decided | Option A — SheetJS Community Edition (`xlsx`) | xlsx |
| spreadsheet-export/TD-02 | phase | Cross-layer | Export Scope & File Structure | decided | Option A — single multi-sheet `.xlsx`, always all domains | — |
| spreadsheet-export/TD-03 | phase | Cross-layer | Plaintext Export Exposure & User Warning | decided | Option A — plaintext export gated by `ConfirmDialog.vue` warning | — |
| spreadsheet-export/TD-04 | phase | Cross-layer | Entry Point & UI Placement | decided | Option B — new dedicated Data Export screen | — |

_Source files:_

- spreadsheet-export — `docs/decisions/technical-decisions-spreadsheet-export.md` (scope_type: phase)

## Capability Coverage

| Capability (from project-plan.md) | Covered by |
|-----------------------------------|------------|
| Add a data-export capability that consolidates every tracked domain [...] into a downloadable spreadsheet file, one sheet/tab per domain, exposed via a new dedicated Data Export screen. | spreadsheet-export/TD-01, spreadsheet-export/TD-02, spreadsheet-export/TD-03, spreadsheet-export/TD-04 |

## Decisions Detail

### spreadsheet-export/TD-01

**Recommendation:** SheetJS's `json_to_sheet` / `book_append_sheet` / `writeFile` trio maps 1:1 onto "one sheet per domain, one downloadable file," requires no styling this phase doesn't need, and is the most-documented option for exactly this use case.
**Libraries:** xlsx

### spreadsheet-export/TD-02

**Recommendation:** a single all-domains `.xlsx` download directly satisfies the phase capability as written and mirrors the one-click export UX already established by `BackupManager.vue`'s "Export Backup" action.
**Libraries:** —

### spreadsheet-export/TD-03

**Recommendation:** it satisfies the capability without adding a dependency or new credential-management surface, and is consistent with how comparable financial apps handle data export; the risk is mitigated procedurally via a proper dialog component rather than technically.
**Libraries:** —

### spreadsheet-export/TD-04

**Recommendation:** directly reuses `BackupManager.vue`'s existing button/status-message pattern instead of introducing a new screen. _(Note: the user's actual decision diverges from this recommendation — see Decision above, Option B. The Capability text and RFC/ADR/FDD were updated to match the decided placement, a new dedicated Data Export screen.)_
**Libraries:** —

## Inherited Decisions Detail

_No inherited TD details._

## Inherited Conventions

- Pure, side-effect-free calculation module per domain in `src/services/` (`financialCalculations.js`, `loanCalculations.js`, `incomeCalculations.js`, `expenseCalculations.js`, `cashFlowCalculations.js`), unit-tested via Vitest with no Vue/DOM dependency; the corresponding `.vue` component only orchestrates state and calls into the module. _(from phase 07/08/09)_
- Every dialog (confirmation, warning) is a Vue `ConfirmDialog` component with explicit dismissal only — no native `window.confirm()`/`alert()` — per `.claude/rules/dialog-implementation.md`. _(from phase 07/08 retrofit)_
- Before implementing a new screen, read at least one existing sibling component of the same kind to reuse layout/interaction conventions (section header, card grid, modal shape, i18n key structure) per `.claude/rules/ui-pattern-consistency.md`. _(project-wide rule — directly applicable, Phase 12 adds a new screen)_
- Read-only template bindings never mutate state as a side effect; explicit user-input handlers (`@input`/`@blur`/`@click`) own all writes. _(from phase 09)_
- `npx vitest run` must show 100% pass rate before any phase is declared complete. _(project-wide rule, `CLAUDE.md`; from phase 11)_
- Documentation-first: every phase requires ADR/RFC/FDD/PRD/TRACKER coverage before or alongside implementation. _(project-wide rule; from phase 11)_

## Inherited Deferred Capabilities

_No inherited deferred capabilities._

## Inherited Known Issues

_No inherited known issues._

## UI Inventory

_No screen inventory — UI↔API sync deferred. Run /screen-inventory 12 (or /screen-inventory spreadsheet-export) and then rerun /plan-context 12 to activate UI checks._

## Non-UI / Deferred Capabilities

| Capability | Status | Rationale | TD refs |
|-----------|--------|-----------|---------|
| (empty on first assembly — plan-resolve appends rows as user marks capabilities) |

## Testing Requirements

### src (single Vue 3 SPA)

_No testing guide available — layer requirements deferred to implementation. Existing convention: Vitest unit tests for the new pure `spreadsheetExportService.js` (row-mapping functions covered without any DOM/SheetJS-write dependency where feasible), plus a Vue Test Utils component test for `DataExport.vue` covering the export button → `ConfirmDialog` → download call flow (mirroring `BackupManager.test.js`'s conventions where applicable, once it exists — presently no `BackupManager.test.js` file is in the repo, so `LoanTracker.test.js`/`ExpenseTracker.test.js` are the closer reference for component-test shape); run via `npx vitest run`._
