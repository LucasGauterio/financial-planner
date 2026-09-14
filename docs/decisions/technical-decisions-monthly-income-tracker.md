---
scope_type: phase
related_phases: [7]
status: decided
date: 2026-09-11
scope_description: "Monthly income registration (salary, dividends, received payments), recurring income rules, and received/pending projections up to 35 years."
---

# Technical Decisions — Monthly Income Registration & Projections

_Subprojects in scope:_

- `src/` — single Vue 3 SPA (no separate backend/frontend split in this project); hosts the new income data model (`src/services/incomeCalculations.js`), its persistence (`src/services/indexedDbRepository.js`), and the tracker UI (`src/components/IncomeTracker.vue`).

---

## TD-01: Income Projection Data Model — Materialized Schedule vs. Rule + Sparse Overrides

**Scope:** Cross-layer

**Capability:** Register income sources (salary, dividends, received payments), each optionally flagged as recurring; generate a month-by-month projection list (received vs. pending) with monthly totals, projectable up to 35 years.

**Context:** `src/services/loanCalculations.js#L15-L59` (`generateCreditCardInstallments`) sets a precedent in this codebase for turning a recurring definition into a materialized array of dated entries with a `status` field, persisted whole. Income projections need the same "received/pending per month" concept, but over a horizon of up to 35 years (420 months) per source, and — unlike a fixed-count loan — a recurring income source has no natural end date. `src/services/indexedDbRepository.js#L116-L123` (`set`) re-encrypts and rewrites the entire value for a key on every save, so the chosen shape directly affects how much data is re-encrypted per edit.

**Options:**

### Option A: Materialized schedule (same pattern as `generateCreditCardInstallments`)
- On creation (and whenever the horizon changes), generate one concrete entry per month up to the requested horizon and store the full array per income source, each entry carrying its own `status: 'received' | 'pending'`.
- **Pros:** Reuses an existing, well-understood pattern in this codebase; toggling a month's status is a plain array mutation.
- **Cons:** A single recurring source projected 35 years out produces 420 stored rows; several sources multiply that. Every save re-encrypts and rewrites the whole `INCOME_KEY` blob (`indexedDbRepository.js#L116-L123`), so storage and write cost grow with the horizon even though most months carry no user-entered information.

### Option B: Recurring rule + on-the-fly derivation + sparse status overrides
- Persist only the income source's rule (amount, start month, optional recurrence cadence) plus a sparse map of `{sourceId, "YYYY-MM"} → status` for months the user has explicitly toggled away from the default. The month-by-month list (and its totals) is derived on read, for whatever horizon the UI currently requests — mirroring how `calculateCompoundInterest`/`calculateRequiredMonthlyContribution` (`src/services/financialCalculations.js#L1-L38`) already project up to `months` periods without persisting an intermediate row per period.
- **Pros:** Storage stays proportional to the number of income sources and to actual user corrections, not to the horizon; consistent with the pure-projection-function pattern already used for compound interest; cheap to re-derive when a source's amount or recurrence changes.
- **Cons:** Departs from the loan module's materialized-array precedent; projection derivation logic needs its own function instead of reusing `generateCreditCardInstallments` directly.

### Option C: Materialized schedule capped to a short rolling window, regenerated periodically
- Materialize only the next N months (e.g., 24) like Option A, and regenerate/extend the window as time passes or the user requests a longer view.
- **Pros:** Bounds storage size regardless of the nominal 35-year horizon.
- **Cons:** "Projectable up to 35 years" is a stated capability — a rolling window can't show year 30 without a regeneration/expansion step, adding state-management complexity (when to extend, how far) for no real storage benefit over Option B.

**Recommendation:** Option B — the capability explicitly asks for a 35-year projection, which makes an unbounded per-month materialized array (Option A) or a capped window needing runtime expansion (Option C) worse fits than deriving the list on demand; this also reuses the pure-function projection style already established by `financialCalculations.js` rather than the finite-installment style of `loanCalculations.js`, which was designed for schedules with a known end.

**Decision:** Option B — Recurring rule + on-the-fly derivation + sparse status overrides.

---

## TD-02: Recurrence Cadence Representation

**Scope:** Cross-layer

**Capability:** Register income sources (salary, dividends, received payments), each optionally flagged as recurring; generate a month-by-month projection list (received vs. pending) with monthly totals, projectable up to 35 years.

**Context:** The request describes salary, dividends, and "received payments" all sharing one "mark as recurring" toggle. Salary is typically monthly, but dividends are frequently quarterly, semi-annual, or annual. TD-01's projection derivation (whichever option is chosen) needs a concrete, unambiguous cadence field to decide which months a recurring source produces a projected entry for.

**Options:**

### Option A: Boolean `recurring` flag, monthly only
- A source is either one-off or repeats every month indefinitely.
- **Pros:** Simplest possible model and UI (single checkbox).
- **Cons:** Cannot represent quarterly/annual dividends without the user creating four/twelve separate "monthly" entries, defeating the point of registering a single recurring source.

### Option B: `recurring` flag + fixed enum of cadences (`monthly`, `quarterly`, `semiAnnual`, `annual`)
- A dropdown of named, real-world cadences.
- **Pros:** Self-documenting in the UI; matches how people actually describe dividend schedules.
- **Cons:** Any cadence outside the enum (e.g., bimonthly) needs a future model/UI change; the projection algorithm needs a lookup table to map enum values to month intervals.

### Option C: `recurring` flag + integer `repeatEveryMonths` (generic interval)
- A single numeric field where `1` = monthly, `3` = quarterly, `6` = semi-annual, `12` = annual, and any other positive integer is a valid custom cadence.
- **Pros:** One field covers every case in Option B plus arbitrary cadences, with no enum-to-interval lookup; the projection loop is a direct `(monthDiff % repeatEveryMonths === 0)` check, composing directly with TD-01 Option B's on-the-fly derivation.
- **Cons:** A raw integer input is less self-explanatory in the UI than named options; needs presets/labels (e.g., "Monthly", "Quarterly") in the form to stay user-friendly.

**Recommendation:** Option C — it subsumes Option B's real-world cadences as presets over the same integer field while remaining generic, and it maps directly onto the modulo check the projection derivation (TD-01) needs, avoiding a separate enum-to-interval translation layer.

**Decision:** Option A — Boolean `recurring` flag, monthly only. Rationale (user): matches the primary use case (monthly salary/payments) and keeps the form simplest; quarterly/annual dividends are registered as separate one-off entries for now.

---

## TD-03: Long-Horizon Projection Rendering Strategy

**Scope:** Cross-layer

**Capability:** Register income sources (salary, dividends, received payments), each optionally flagged as recurring; generate a month-by-month projection list (received vs. pending) with monthly totals, projectable up to 35 years.

**Context:** `src/components/InvestmentTimeline.vue#L42-L75` renders monthly rows grouped by year using plain `v-for`, but that component only projects ~24 months into the future (`InvestmentTimeline.vue#L167`). A 35-year income projection is up to 420 rows per view; the project has no virtual-scroll dependency in `package.json` (only `vue`), so rendering strategy for this scale is an open question, not something the existing pattern already answers.

**Options:**

### Option A: Render the full computed horizon at once, grouped by year
- Reuse the existing `v-for group → v-for item` grouped-list pattern from `InvestmentTimeline.vue`, just extended to however many years are requested (up to 420 rows for 35 years).
- **Pros:** No new UI pattern or dependency; visually consistent with the Timeline component.
- **Cons:** Mounting 420 rows (plus per-row controls for toggling received/pending) on every view, even when the user only cares about the next year, is unnecessary DOM/render work and scroll distance.

### Option B: User-selectable horizon (e.g., 1 / 5 / 10 / 35 years) driving how many months are computed and rendered
- A horizon selector (similar in spirit to existing goal/timeframe inputs elsewhere in the app) controls the `months` argument passed to the TD-01 projection derivation; default to a short horizon (e.g., 12–24 months) and let the user opt into the full 35 years.
- **Pros:** Keeps the default view small and fast; still reuses the same grouped-list rendering as Option A once the shorter list is computed — this only bounds *how many* months are requested, not *how* they're rendered.
- **Cons:** Requires one extra control and a bit of state to remember the selected horizon.

### Option C: Full 420-month computation with windowed/virtualized rendering (only visible rows mounted)
- Compute the whole 35-year list but hand-roll a virtual-scroll window so only on-screen rows exist in the DOM.
- **Pros:** Handles the full horizon without a horizon selector.
- **Cons:** No virtualization library is present in `package.json`; hand-rolling one is a meaningfully larger, riskier undertaking than a horizon selector for a problem (420 simple rows) that plain rendering with a smaller default already solves.

**Recommendation:** Option B — it reuses the grouped-list rendering pattern already proven in `InvestmentTimeline.vue` without adding a virtualization dependency or hand-rolled scroll-window code, and a horizon selector matches the mental model users already have from the Goal Calculator's timeframe inputs.

**Decision:** Option B — User-selectable horizon, defaulting to a short window with an option to view up to 35 years.

---

## TD-04: Received/Pending Default Status Determination

**Scope:** Cross-layer

**Capability:** Register income sources (salary, dividends, received payments), each optionally flagged as recurring; generate a month-by-month projection list (received vs. pending) with monthly totals, projectable up to 35 years.

**Context:** The projection list must show, per month, "se foi recebido ou não" (whether it was received or not). TD-01 Option B persists only sparse overrides, so a default status is needed for every month that has no override, and that default determines what counts as an "override" worth persisting at all. `src/services/loanCalculations.js#L53` defaults every generated installment to `status: 'pending'` regardless of date, which is the closest existing precedent but was designed for a manually-confirmed payment schedule, not a recurring income stream spanning past and future months.

**Options:**

### Option A: Date-inferred default (past/current months default to "received", future months default to "pending")
- A month's default status is derived from comparing its date to the current month; the user only needs to toggle exceptions (e.g., a missed payment).
- **Pros:** Minimal manual work for the common case (salary reliably received every month); keeps TD-01's override map genuinely sparse, since only exceptions are persisted.
- **Cons:** Silently assumes income was received unless corrected — a user who never checks the list will see optimistic totals for past months that were actually missed.

### Option B: Manual-only default ("pending" regardless of date, same as `loanCalculations.js` installments)
- Every month, past or future, defaults to `pending` until the user explicitly marks it received.
- **Pros:** No assumptions baked into the data; mirrors the existing loan installment convention exactly.
- **Cons:** For years of recurring monthly salary, the user would need to manually confirm every past month to see accurate historical totals — the override map stops being sparse and becomes a near-complete duplicate of the derived list, undermining TD-01 Option B's storage rationale.

**Recommendation:** Option A — it keeps TD-01 Option B's override map sparse (only real exceptions are persisted) and matches this app's existing bias toward optimistic/projected figures (compound-interest and goal projections already assume contributions happen as planned unless the user changes them), while still letting the user correct any month that didn't go as expected.

**Decision:** Option B — Manual-only default (every month, past or future, defaults to `pending` until explicitly marked received), consistent with the existing `loanCalculations.js` installment convention. Rationale (user): no assumptions baked into historical totals; user confirms every month explicitly.

---

## Decisions Summary

| ID | Scope | Decision | Recommendation | Choice |
|----|-------|----------|---------------|--------|
| TD-01 | Cross-layer | Income Projection Data Model | Option B — Recurring rule + sparse overrides | Option B |
| TD-02 | Cross-layer | Recurrence Cadence Representation | Option C — Generic `repeatEveryMonths` interval | Option A — Monthly-only recurring flag |
| TD-03 | Cross-layer | Long-Horizon Projection Rendering Strategy | Option B — User-selectable horizon | Option B |
| TD-04 | Cross-layer | Received/Pending Default Status Determination | Option A — Date-inferred default | Option B — Always pending until confirmed |
