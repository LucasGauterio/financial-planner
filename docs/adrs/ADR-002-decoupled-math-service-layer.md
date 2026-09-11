# ADR-002: Decoupled Pure Financial Math Service Layer

- **Status**: Accepted
- **Date**: 2026-09-11
- **Deciders**: Software Architecture Team

## Context & Problem Statement
Compound interest calculations, timeline projections, and monthly target estimations can become complex and bug-prone if embedded directly inside Vue template UI files.

## Decision Outcome
Chosen Option: **Offload all financial math to pure JS service modules (`src/services/financialCalculations.js`) backed by 100% Vitest unit test coverage**.

### Rationale:
- Pure functions have zero UI side effects and are easily unit tested.
- Prevents UI component bloat and ensures 100% calculation accuracy.
