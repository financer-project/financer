---
gsd_state_version: 1.0
milestone: v1.1.0
current_phase: 01
current_phase_name: Bug Fixes & E2E Baseline
status: executing
stopped_at: Phase 01 UI-SPEC approved
last_updated: "2026-08-21T15:16:46.102Z"
last_activity: 2026-08-21
last_activity_desc: Phase 01 execution started
state_head: f4764081ad1b247fb68f29f683585fab55a4ce95
progress:
  total_phases: 5
  completed_phases: 0
  total_plans: 4
  completed_plans: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-08-21)

**Core value:** Households can reliably track, categorize, and understand their shared finances together — accurate transaction data and household collaboration must always work.
**Current focus:** Phase 01 — Bug Fixes & E2E Baseline

## Current Position

Milestone: v1.1.0 (mode: mvp)
Phase: 01 (Bug Fixes & E2E Baseline) — EXECUTING
Plan: 1 of 4
Status: Executing Phase 01
Last activity: 2026-08-21 — Phase 01 execution started

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**

- Total plans completed: 0
- Average duration: —
- Total execution time: 0.0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**

- Last 5 plans: —
- Trend: —

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: Bug fixes/test baseline first, Prisma 7 migration isolated second, Splitting Groups built against the stabilized v7 client — never interleaved (ARCHITECTURE anti-pattern 4)
- [Roadmap]: Splitting Groups sliced into 3 vertical MVP increments — foundation (schema/tokens) → core expense/split/balance/settle loop → lifecycle/close
- [Roadmap]: Phase 2 is gated on a `enhancePrisma()` + driver-adapter spike; a failed spike stops the migration rather than proceeding

### Pending Todos

[From .planning/todos/pending/ — ideas captured during sessions]

None yet.

### Blockers/Concerns

[Issues that affect future work]

- **Phase 2 gate (open):** `enhancePrisma()` compatibility with the Prisma 7 driver-adapter constructor is unverified — single low-confidence source. Spike before scoping the migration.
- **Phase 3 decision (open):** Research conflicts on the money type. STACK.md says follow the existing `Float` convention; PITFALLS #2 and SUMMARY.md say never `Float` for split math (integer minor units or `Decimal`). Must be resolved during Phase 3 planning — expensive to reverse after data exists.
- **Phase 3 security (open):** App has zero rate limiting today. Permanent bearer-token links need Redis-backed rate limiting, `Referrer-Policy: no-referrer`, and token scrubbing from logs before shipping.
- **Phase 3 design (open):** Link revocation/rotation is not a v1 requirement but the schema should support it now (status/`revokedAt` column) — retrofitting onto permanent links later is breaking.

## Deferred Items

Items acknowledged and deferred at milestone close, most recent first:

| Category | Item | Status | Deferred At | Milestone |
|----------|------|--------|-------------|-----------|
| *(none)* | | | | |

## Session Continuity

Last session: 2026-08-21T10:16:58.815Z
Stopped at: Phase 01 UI-SPEC approved
Resume file: .planning/phases/01-bug-fixes-e2e-baseline/01-UI-SPEC.md
