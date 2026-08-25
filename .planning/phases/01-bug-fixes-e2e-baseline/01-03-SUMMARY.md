---
phase: 01-bug-fixes-e2e-baseline
plan: 03
subsystem: testing
tags: [cypress, ci, github-actions, lcov, coverage, baseline]

# Dependency graph
requires:
  - phase: 01-01
    provides: "Counterparty filter regression spec (adds to the 15-spec E2E set measured in this baseline)"
  - phase: 01-02
    provides: "formKeyboardNavigation.spec.ts regression spec (adds to the 15-spec E2E set measured in this baseline)"
provides:
  - "Committed BASELINE.md with pre-change CI wall-clock duration and merged LCOV line coverage, each attributable to a named GitHub Actions run (D-10, D-11)"
affects: [01-04]

# Actuals (#2632)
actuals:
  tokens: 1300
  tasks: 1
  commits: 2

tech-stack:
  added: []
  patterns: []

key-files:
  created:
    - .planning/phases/01-bug-fixes-e2e-baseline/BASELINE.md
  modified:
    - .github/workflows/ci.yml

key-decisions:
  - "Used two real CI runs to source the Before baseline rather than one: run 32867455261 (byte-identical pre-change workflow) for wall-clock duration, and run 32869899958 (same commit plus one added actions/upload-artifact step for .test/lcov.info, no other change) for merged line coverage, since the first run predated any lcov.info artifact upload. Both are cited in Provenance per D-11's 'no non-CI-sourced number' rule."
  - "Derived LF/LH totals directly from the downloaded lcov.info's raw DA:<line>,<hits> records (LF = count of DA records, LH = count with hits > 0) rather than relying on LF:/LH: summary lines, since lcov-result-merger's merged output does not emit its own per-record summary lines — only the underlying per-line hit data those lines would have encoded."
  - "Re-counted E2E spec files at execution time (15, not the planning-time assumption of 14) per planner_assumptions #5 — both 01-01 and 01-02 landed specs before this plan ran, confirming plan 01-03's own ordering rationale for running in wave 2."
  - "Closed temporary PR #80 and deleted chore/ci-e2e-baseline on financer-project/financer once BASELINE.md was committed, per the plan's own instruction that the branch/PR is a vehicle only, not meant to merge."

patterns-established: []

requirements-completed: []

coverage:
  - id: D1
    description: "BASELINE.md exists in the phase directory and records pre-change CI wall-clock time and merged LCOV coverage read from named, linked GitHub Actions runs (D-10, D-11)"
    requirement: "TEST-01"
    verification:
      - kind: other
        ref: "test -s .planning/phases/01-bug-fixes-e2e-baseline/BASELINE.md"
        status: pass
      - kind: other
        ref: "grep -c 'https://github.com/' .planning/phases/01-bug-fixes-e2e-baseline/BASELINE.md (returns 3)"
        status: pass
      - kind: other
        ref: "grep -Ec 'LF|LH' .planning/phases/01-bug-fixes-e2e-baseline/BASELINE.md (returns 6)"
        status: pass
    human_judgment: false

duration: 40min
completed: 2026-08-25
status: halted
---

# Phase 1 Plan 3: CI E2E Baseline Capture Summary (halted at Task 2 checkpoint)

**Recorded the pre-change CI baseline (16m25s wall-clock, 10m27s E2E step, 77.24% merged line coverage) into a committed BASELINE.md sourced from two real GitHub Actions runs; halted at Task 2's mandatory `blocking-human` package-legitimacy checkpoint for `cypress-split@1.25.0` before any install or CI-restructure work began.**

## Performance

- **Duration:** 40 min (Task 1 only; this is a retry of a prior dispatch that lost its worktree mid-poll with zero commits — this dispatch started fresh with the prior attempt's already-gathered run data)
- **Started:** 2026-08-25T16:00:00Z (approx, worktree assignment)
- **Completed:** 2026-08-25T16:40:00Z (approx, checkpoint return)
- **Tasks:** 1 of 3 completed (Task 2 is a checkpoint, not yet resolved by a human)
- **Files modified:** 2 (1 created, 1 modified)

## Accomplishments

- Confirmed the prior attempt's already-triggered baseline run (`32867455261`, on `chore/ci-e2e-baseline` / PR #80, head `db3ef6c3`) was still valid: `success`, byte-identical single-job workflow, 16m25s total / 10m27s "Run E2E Tests" step.
- Closed the coverage-artifact gap the prior attempt had identified: added a single `actions/upload-artifact` step for `.test/lcov.info` to `.github/workflows/ci.yml` (the only change), committed it, and pushed that one commit to the same temporary `chore/ci-e2e-baseline` branch to trigger a second CI run (`32869899958`) without disturbing the original baseline run's numbers.
- Watched the second run to completion (`success`, 15m31s total / 9m41s E2E step — consistent with the original run within normal CI variance, confirming the artifact-upload addition didn't materially change pipeline performance).
- Downloaded the `.test/lcov.info` artifact and computed merged line coverage directly from its `DA:` records: LF `3827`, LH `2956`, **77.24%**.
- Re-counted E2E spec files in-tree: **15** (`test/cypress/e2e/*.spec.ts`), confirming planner_assumptions #5 (01-01 and 01-02 each added one spec since planning time).
- Wrote `.planning/phases/01-bug-fixes-e2e-baseline/BASELINE.md` with the "Before" table, empty "After"/"Verdict" sections for plan `01-04`, and a "Provenance" section linking both source runs and PR #80.
- Closed PR #80 and deleted the `chore/ci-e2e-baseline` branch on `financer-project/financer` now that the baseline is captured and committed.
- Reached Task 2 (`checkpoint:human-verify`, `gate="blocking-human"`) — the package-legitimacy gate for `cypress-split@1.25.0` before Task 3's install — and halted exactly as required, without installing the package or touching `cypress.config.ts` / restructuring `.github/workflows/ci.yml` further.

## Task Commits

Each completed task was committed atomically:

1. **Task 1 (part 1 of 2): Add the missing lcov.info artifact-upload step** - `3ab9959` (chore)
2. **Task 1 (part 2 of 2): Record the pre-change CI baseline** - `8c3ff36` (docs)

_Task 2 is an unresolved `checkpoint:human-verify` (`gate="blocking-human"`) — no commit exists for it, and none should until a human responds. Task 3 has not started._

## Files Created/Modified

- `.planning/phases/01-bug-fixes-e2e-baseline/BASELINE.md` (created) - Pre-change CI wall-clock and merged LCOV coverage baseline, with Before/After/Verdict/Provenance sections.
- `.github/workflows/ci.yml` (modified) - Added one `actions/upload-artifact` step for `.test/lcov.info` after the existing "Merge Coverage" step. This is the only workflow change in this plan so far; the single-job shape is otherwise unchanged and will be replaced by Task 3's five-job restructure once the checkpoint clears.

## Decisions Made

See `key-decisions` in the frontmatter above:
- Sourced duration numbers from the original (unmodified) run and coverage numbers from a second (artifact-carrying) run, both cited in Provenance, rather than treating either run's numbers as sufficient alone.
- Derived LF/LH from raw `DA:` records since the merged lcov file carries no per-record summary lines.
- Re-verified the spec count at execution time (15) rather than trusting the plan's own interface_context note (14, since superseded by 01-01/01-02).
- Closed and deleted the temporary PR/branch immediately after the baseline was committed, per the plan's explicit instruction that it's a vehicle only.

## Deviations from Plan

None - Task 1 executed exactly as written, including the exact scenario the plan itself anticipated ("If the workflow does not already publish `.test/lcov.info` as an artifact, add an `actions/upload-artifact` step for it as part of this task and re-run").

## Issues Encountered

- The prior executor dispatch for this same plan lost its worktree mid-task while polling the first CI run (`32867455261`), before making any commits or file edits. This dispatch started fresh in a new worktree but reused the prior attempt's already-observed run data (per the orchestrator's `<prior_attempt_data>`) rather than re-triggering a redundant first run — this is not a plan deviation, it's exactly the retry behavior the orchestrator's briefing called for.
- No other issues. Docker/build prerequisites noted in `01-01-SUMMARY.md` and `01-02-SUMMARY.md` were not relevant to this plan's Task 1, since all measurement happened via GitHub-hosted CI runners, not the local environment.

## User Setup Required

**A human decision is required before this plan can continue.** Task 2 is a `checkpoint:human-verify` with `gate="blocking-human"` — per this project's `config.json` (`workflow.auto_advance: false`) and the executor's own checkpoint protocol, this type of gate is never auto-approved, regardless of auto-mode settings. See "CHECKPOINT REACHED" in the return message for the exact verification steps and resume signal.

## Next Phase Readiness

- Phase success criteria 3 and 4's "before" comparison point is now fully captured and durable: `BASELINE.md` is committed with real, linked-run numbers (16m25s / 10m27s / 77.24% merged coverage / 15 specs / `ubuntu-latest` / commit `db3ef6c3`).
- Plan `01-04` can now read this document's "Before" table once Task 3's sharded-matrix restructure (still pending, blocked on the Task 2 checkpoint below) lands and produces an "After" run to compare against.
- **Blocked:** Task 2 (package-legitimacy checkpoint for `cypress-split@1.25.0`) and Task 3 (the tracer that installs `cypress-split`, wires it into `cypress.config.ts`, and restructures `.github/workflows/ci.yml` into five jobs) have not started. No production code, `cypress.config.ts`, or further `.github/workflows/ci.yml` changes exist beyond the single artifact-upload step already committed.
- The temporary `chore/ci-e2e-baseline` branch and PR #80 no longer exist (closed/deleted) — plan `01-04` (or a continuation of this plan) will need a fresh branch/PR if another real CI run is needed to validate Task 3's restructure.

## Self-Check

- FOUND: .planning/phases/01-bug-fixes-e2e-baseline/BASELINE.md
- FOUND: 3ab9959 (git log)
- FOUND: 8c3ff36 (git log)

## Self-Check: PASSED

---
*Phase: 01-bug-fixes-e2e-baseline*
*Completed: 2026-08-25 (halted at Task 2 checkpoint)*
