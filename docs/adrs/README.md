# Architecture Decision Records (ADRs)

This directory contains key architectural decisions for the **FinancialPlanner** repository.

| Index | Title | Status | Date |
|---|---|---|---|
| [ADR-001](file:///G:/Projects/FinancialPlanner/docs/adrs/ADR-001-offline-indexeddb-storage.md) | Offline-First IndexedDB Storage with Client-Side AES-GCM Encryption | Approved | 2026-09-11 |
| [ADR-001](file:///G:/Projects/FinancialPlanner/docs/adrs/ADR-001-zero-trust-client-encryption.md) | Zero-Trust Client-Side Vault Encryption | Accepted | 2026-09-11 |
| [ADR-002](file:///G:/Projects/FinancialPlanner/docs/adrs/ADR-002-decoupled-math-service-layer.md) | Decoupled Pure Financial Math Service Layer | Accepted | 2026-09-11 |
| [ADR-003](file:///G:/Projects/FinancialPlanner/docs/adrs/ADR-003-loan-tracker-pattern-reuse.md) | Loan Tracker Persistence & Calculation Layer — Reuse of Established Patterns | Accepted | 2026-09-14 |
| [ADR-004](ADR-004-expense-tracker-pattern-reuse.md) | Expense Tracker Persistence & Projection Layer — Reuse of Income Tracker Pattern | Accepted | 2026-09-14 |
| [ADR-005](ADR-005-expense-recurring-end-date.md) | Recurring Expense End Date — Bounded Divergence from the Income Tracker Pattern | Accepted | 2026-09-14 |
| [ADR-006](ADR-006-tracker-source-edit-delete.md) | Income/Expense Source Edit & Delete — Reuse of Loan Tracker Interaction Pattern | Accepted | 2026-09-14 |
| [ADR-007](ADR-007-cash-flow-overview.md) | Editable Actual Amounts & Consolidated Cash Flow Overview | Accepted | 2026-09-14 |
| [ADR-008](ADR-008-income-expense-card-restyle.md) | Income/Expense Tracker Card & Drawer Restyle — Reuse of Loan Tracker Visual Pattern | Accepted | 2026-09-14 |
| [ADR-009](ADR-009-horizon-ruler-slider.md) | Income/Expense Projection Horizon — Reuse of Portfolio Tracker's Ruler Slider | Accepted | 2026-09-15 |
| [ADR-010](ADR-010-income-recurring-end-date.md) | Recurring Income End Date — Reuse of Expense Tracker's `endMonth` Pattern | Accepted | 2026-09-15 |
| [ADR-011](ADR-011-bounded-source-full-span-projection.md) | Bounded Sources Always Project Their Full Start-to-End Span | Accepted | 2026-09-15 |
| [ADR-012](ADR-012-month-granularity-horizon-slider.md) | Income/Expense Horizon Slider Steps Month by Month, Defaults to Near-Term | Accepted | 2026-09-15 |
| [ADR-013](ADR-013-cashflow-horizon-ruler-slider.md) | Cash Flow Overview Horizon Adopts the Same Ruler Slider as Portfolio/Income/Expense | Accepted | 2026-09-15 |
| [ADR-014](ADR-014-stats-dashboard-horizon-window-scoping.md) | Stats Dashboard Scoped to the Selected Horizon Window | Accepted | 2026-09-15 |
| [ADR-015](ADR-015-default-horizon-current-month-only.md) | Projection Horizon Defaults to the Current Month Only | Accepted | 2026-09-15 |
| [ADR-016](ADR-016-full-dependency-and-runtime-upgrade.md) | Full Dependency & Runtime Upgrade (Phase 11) | Accepted | 2026-09-15 |
