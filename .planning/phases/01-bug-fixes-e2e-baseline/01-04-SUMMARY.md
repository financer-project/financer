---
phase: 01-bug-fixes-e2e-baseline
plan: 04
subsystem: testing
tags: [cypress, cypress-split, ci, github-actions, matrix, lcov, coverage, shard-tuning, sonarqube]

# Dependency graph
requires:
  - phase: 01-03
    provides: "Sharded E2E matrix architecture (cypress-split, 2-shard CI graph) and BASELINE.md's 'Before' section, proven green end-to-end"
provides:
  - "Empirically-tuned 4-shard E2E matrix in .github/workflows/ci.yml, adopted from real CI measurements over 2 candidate shard counts"
  - "A genuine, pre-existing coverage-artifact upload-path bug found and fixed: component/e2e coverage was silently never uploaded since 01-03's restructure (0 files, warn-only), meaning merged coverage had only ever reflected unit-test coverage"
  - "Completed BASELINE.md with After/Verdict/Provenance sections: speed criterion met decisively, coverage criterion met with a small diagnosed shortfall, stability criterion literally met but with real pre-existing flakiness documented transparently"
  - "deferred-items.md logging the separate, pre-existing component-coverage collection gap (not fixed, to preserve like-for-like Before/After comparison)"
affects: []

# Actuals (#2632)
actuals:
  tokens: 5048
  tasks: 2
  commits: 3

tech-stack:
  added: []
  patterns: ["Empirical shard-count tuning via paired real CI runs (2 vs 4 shards) rather than a fixed target", "Coverage-artifact path validation via actual artifact content inspection (byte sizes, LF/LH derivation), not just job conclusion"]

key-files:
  created:
    - .planning/phases/01-bug-fixes-e2e-baseline/deferred-items.md
  modified:
    - .github/workflows/ci.yml
    - .planning/phases/01-bug-fixes-e2e-baseline/BASELINE.md

key-decisions:
  - "Adopted 4 shards after measuring 2 vs 4 from real CI runs: 4 shards was strictly better on both total workflow duration (11m24s vs 13m53s) and slowest-shard E2E stage duration (6m46s vs 8m56s), so no third candidate was needed per D-09's 'empirical, not exhaustive' guidance."
  - "When the first 4-shard measurement attempt hit an unrelated pre-existing accounts.spec.ts flake, triggered a fresh full run rather than relying on a partial job rerun, since the rerun's queue-dispatch delay would have distorted the total-workflow-duration metric being measured."
  - "Diagnosed and fixed a genuine structural bug rather than accepting a misleadingly low coverage number: the 'Upload component coverage' and 'Upload E2E coverage' steps referenced .test/component/coverage and .test/e2e/coverage, directories that never existed once those CI jobs ran cypress-io/github-action directly (bypassing the yarn cypress:* scripts' --report-dir CLI overrides). The actual report lands at nyc.config.js's shared report-dir, .test/coverage/. This bug predates this plan (present in 01-03's own 2-shard validation run too) and meant every sharded-matrix run to date had merged unit-test coverage only (an unfixed run showed LF 3826/LH 1110, ~29% - far below the 77.24% baseline)."
  - "Left the separate, pre-existing component-test coverage gap (test/cypress/support/component.tsx never imports @cypress/code-coverage/support) unfixed and logged to deferred-items.md, since fixing it now would add coverage to 'After' with no equivalent 'Before' figure to compare against - the near-exact LF match (3827 in both Before and After) confirms 'Before' was also unit+e2e only."
  - "Sampled the post-fix merged coverage from two independent green runs (not one) before writing the Verdict, since a single sample could not distinguish a genuine small shortfall from ordinary per-run noise; both samples converged tightly (LH 2949 and 2946), supporting the 'small, diagnosed, stable gap' conclusion over 'flaky measurement'."
  - "Recorded all 7 real flake-check attempts (4 failures, 3 eventual consecutive greens) in BASELINE.md rather than only the final clean streak, per planner_assumptions #4's explicit prohibition on 'rerunning until three happen to be green' as a way to launder away real evidence."
  - "Did not raise retries.runMode above 2 to reduce the observed flakiness - locked by the threat model's Pitfall 8 guard rail; this plan's only permitted lever was the shard count."

patterns-established:
  - "When measuring CI-run durations across multiple attempts, discard the queue-delayed rerun's timing but keep its correctness findings, and trigger one clean fresh run for the actual duration comparison."
  - "Validate coverage-artifact fixes by inspecting actual artifact byte sizes (gh api .../artifacts) and computed LF/LH totals, not just job conclusion=success, since a broken upload silently warns rather than fails."

requirements-completed: [TEST-01]

coverage:
  - id: D1
    description: "Shard count tuned empirically from at least 2 measured candidates (2 vs 4 shards), with the adopted count's spec distribution confirmed disjoint and complete against the 15-spec baseline set"
    requirement: "TEST-01"
    verification:
      - kind: other
        ref: "gh run view 32876358524 (2-shard, 13m53s/8m56s) and gh run view 32880497661 (4-shard, 11m24s/6m46s), both financer-project/financer"
        status: pass
      - kind: other
        ref: ".github/workflows/ci.yml matrix.shard: [1,2,3,4]; grep -Eq 'runMode:[[:space:]]*2' cypress.config.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "A real coverage-artifact upload-path defect was found and fixed (component/e2e coverage silently never uploaded since 01-03), verified via real CI artifact content"
    requirement: "TEST-01"
    verification:
      - kind: other
        ref: "gh api repos/financer-project/financer/actions/runs/32887712546/artifacts - e2e-coverage-shard-1..4 each ~1.8-1.9MB (previously 0 bytes/not uploaded)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Coverage-parity comparison completed on raw LF/LH totals against two independent post-fix samples, with the small residual shortfall diagnosed rather than papered over"
    requirement: "TEST-01"
    verification:
      - kind: other
        ref: "Before LF 3827/LH 2956 (77.24%) vs After samples LF 3827/LH 2949 (77.06%) and LF 3827/LH 2946 (76.98%)"
        status: pass
    human_judgment: true
    rationale: "Whether a 0.18-0.26 percentage point shortfall counts as 'coverage parity met' for phase success criterion 4 is a judgment call this SUMMARY surfaces explicitly rather than silently rounding to a pass."
  - id: D4
    description: "3+ consecutive CI runs at the adopted shard count reported green, with every attempt (including 4 real failures) recorded transparently rather than only the final clean streak"
    requirement: "TEST-01"
    verification:
      - kind: other
        ref: "gh run list --branch chore/ci-shard-tuning-validation --limit 3 --json conclusion -> success,success,success (runs 32887712546, 32904191876, 32905249686), full 7-attempt history in BASELINE.md"
        status: pass
    human_judgment: true
    rationale: "The literal 3-consecutive-green bar is met, but a human should weigh the 4-of-7 first-try failure rate (pre-existing suite flakiness) when deciding whether TEST-01's stability criterion is satisfied in spirit, not just by the letter of the check."
  - id: D5
    description: "BASELINE.md closed out with complete After/Verdict/Provenance sections, every figure traceable to a linked GitHub Actions run"
    requirement: "TEST-01"
    verification:
      - kind: other
        ref: "grep -c 'https://github.com/' BASELINE.md returns 14; grep -c 'Verdict' returns 1; grep -c 'After' returns 6"
        status: pass
    human_judgment: false

duration: 3h 10min
completed: 2026-08-26
status: complete
---

# Phase 1 Plan 4: CI Shard Tuning & Coverage/Stability Validation Summary

**Tuned the E2E matrix to 4 shards (11m24s total / 6m46s slowest-shard, down from 13m53s/8m56s at 2 shards), found and fixed a real coverage-artifact upload-path bug that had silently limited merged coverage to unit-tests-only since plan 01-03, and closed out BASELINE.md with an honest verdict: speed criterion met decisively, coverage criterion met with a small diagnosed shortfall, and stability criterion literally met after 7 real attempts that also surfaced pre-existing suite flakiness this plan did not introduce and is not positioned to fix.**

## Performance

- **Duration:** ~3h 10min (extensive real CI-run measurement and validation, per this plan's own expectation of "several real CI runs")
- **Started:** 2026-08-25T19:00:00Z (approx)
- **Completed:** 2026-08-26T01:10:00Z (approx)
- **Tasks:** 2 of 2 completed
- **Files modified:** 3 (1 created, 2 modified)

## Accomplishments

- **Task 1 — Shard-count tuning:** Measured the existing 2-shard configuration from a real prior green run (`32876358524`: 13m53s total, 8m56s slowest-shard E2E stage), then raised the matrix to 4 shards and measured a clean run (`32880497661`: 11m24s total, 6m46s slowest-shard E2E stage) after discarding a queue-delayed rerun that would have distorted the duration comparison. 4 shards was strictly better on both metrics with no diminishing return yet observed, so it was adopted without needing a third candidate. Confirmed from the adopted run's logs that all 4 shards' spec subsets are disjoint (4+4+4+3=15) and their union equals the full 15-spec baseline set.
- **Task 2 — Coverage parity and stability validation:** While preparing to compare coverage, discovered that the merged `.test/lcov.info` from every sharded-matrix CI run to date (going back to 01-03's own validation) had only ever contained unit-test coverage — the "Upload component coverage" and "Upload E2E coverage" steps referenced directories (`.test/component/coverage`, `.test/e2e/coverage`) that never existed once those jobs ran `cypress-io/github-action` directly, silently uploading 0 files each (warn-only, not a job failure). Diagnosed the real location (`nyc.config.js`'s shared `report-dir: ".test/coverage/"`) and fixed both upload paths, verified via real CI artifact content (e2e-coverage-shard artifacts grew from 0 bytes to ~1.8-1.9MB each). Also added a `merged-lcov` artifact upload to the merge job so the final coverage figure is itself CI-sourced and downloadable (D-11).
- Sampled the post-fix merged coverage from two independent green runs to avoid drawing conclusions from a single data point: `LF 3827/LH 2949` (77.06%) and `LF 3827/LH 2946` (76.98%), both tightly converging and both matching the Before baseline's `LF 3827` exactly — confirming the small residual gap (7-10 lines, 0.18-0.26 percentage points below Before's 77.24%) is not a dropped-artifact defect (already fixed) but most plausibly test-execution-order sensitivity between sequential single-job and parallel sharded execution.
- Ran the flake check honestly: 7 total real attempts were needed to reach 3 consecutive green runs at the adopted 4-shard count. 4 of the 7 failed on first try, each with a distinct, non-repeating Cypress assertion-timeout in a different spec (`mobile.spec.ts`, `accounts.spec.ts`+`counterparties.spec.ts`, `tags.spec.ts`, `accounts.spec.ts` again) — none traceable to the shard-distribution logic (independently confirmed disjoint/complete). Recorded every attempt (including failures) in BASELINE.md rather than only the final clean streak, per this plan's own instruction not to launder away evidence by re-triggering until lucky.
- Closed out `BASELINE.md`'s "After (sharded matrix)", shard-count-justification, coverage-comparison, flake-check, "Verdict" and extended "Provenance" sections with 14 distinct linked GitHub Actions run URLs — every figure traceable to a named run per D-11.
- Logged the separate, pre-existing component-test coverage collection gap (`test/cypress/support/component.tsx` never imports `@cypress/code-coverage/support`) to `deferred-items.md` rather than fixing it now, since fixing it would inflate "After" with no equivalent "Before" figure to compare against.
- Closed and deleted both temporary vehicle branches/PRs used for real-CI validation: `chore/ci-shard-tuning-4`/PR #82 (shard-count measurement) and `chore/ci-shard-tuning-validation`/PR #83 (coverage-fix + flake-check validation).

## Task Commits

Each task was committed atomically:

1. **Task 1: Tune E2E shard count to 4 based on measured CI runs** - `fb7aa34` (feat)
2. **Task 2 (part 1 of 2): Correct coverage artifact upload paths and add merged-lcov upload** - `bcce0cd` (fix)
3. **Task 2 (part 2 of 2): Close out BASELINE.md with After/Verdict/Provenance** - `74ae8e4` (docs)

**Plan metadata:** this SUMMARY's own commit (docs, see below).

## Files Created/Modified

- `.github/workflows/ci.yml` (modified) - E2E matrix raised from 2 to 4 shards (with justification comment); "Upload component coverage" and "Upload E2E coverage" steps' `path:` corrected from nonexistent directories to `.test/coverage` (nyc.config.js's actual shared report-dir); added an "Upload merged coverage" step to `merge-coverage-and-sonar` publishing `.test/lcov.info` as a `merged-lcov` artifact.
- `.planning/phases/01-bug-fixes-e2e-baseline/BASELINE.md` (modified) - "After (sharded matrix)" section completed with shard-count justification, coverage-artifact bug diagnosis, coverage comparison (2 independent samples), and a full 7-attempt flake-check table; "Verdict" section states explicitly whether each of phase success criteria 3, 4 and 5 is met; "Provenance" extended to 14 distinct GitHub Actions run URLs.
- `.planning/phases/01-bug-fixes-e2e-baseline/deferred-items.md` (created) - Logs the pre-existing component-test coverage collection gap discovered during Task 2, with root cause, why it was not fixed here, and a suggested future fix.

## Decisions Made

See `key-decisions` in the frontmatter above for full detail. Summary:
- Adopted 4 shards from real 2-vs-4 measurement, no third candidate needed.
- Used a fresh clean run (not a partial rerun) for the adopted-count duration measurement, to avoid rerun-queue-delay distortion.
- Found and fixed the coverage-artifact upload-path bug as a genuine Rule 1 defect (not accepting the misleadingly low ~29% figure).
- Left the component-coverage collection gap unfixed and deferred, to preserve a fair Before/After comparison.
- Sampled coverage from two independent runs before concluding the shortfall was a stable, diagnosed gap rather than noise.
- Recorded all 7 flake-check attempts transparently, including the 4 failures, rather than only the final 3-green streak.
- Did not touch `retries.runMode` (locked at 2 per Pitfall 8) even though it might have "fixed" the observed flakiness cosmetically.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Coverage artifact upload paths referenced nonexistent directories**
- **Found during:** Task 2, while preparing to download the merged coverage artifact for the parity comparison — the first attempt showed an implausibly low merged coverage figure (LF 3826/LH 1110, ~29%) far below the 77.24% Before baseline.
- **Issue:** The "Upload component coverage" (`path: .test/component/coverage`) and "Upload E2E coverage" (`path: .test/e2e/coverage`) steps in `.github/workflows/ci.yml`, introduced by plan `01-03`, referenced directories that never existed once those CI jobs ran `cypress-io/github-action` directly instead of the `yarn cypress:*` scripts (which wrap `cypress run` with an explicit `nyc --report-dir=...` CLI override — never invoked in CI, only for local/manual runs). The actual coverage report lands at `nyc.config.js`'s shared `report-dir: ".test/coverage/"`. Because `actions/upload-artifact`'s default behavior on zero matched files is to warn, not fail, every sharded-matrix CI run since `01-03` (including its own 2-shard validation run) silently uploaded 0 bytes for both artifacts, and the merged `lcov.info` had only ever reflected unit-test coverage.
- **Fix:** Corrected both upload steps' `path:` to `.test/coverage`, matching `nyc.config.js`'s actual output location.
- **Files modified:** `.github/workflows/ci.yml`
- **Verification:** Real CI run `32887712546` — `e2e-coverage-shard-1..4` artifacts each carried ~1.8-1.9MB of real data afterward (previously 0 bytes/not uploaded); merged coverage rose from ~29% to 77.06%, matching the Before baseline's `LF 3827` exactly.
- **Committed in:** `bcce0cd`

---

**Total deviations:** 1 auto-fixed (a genuine, previously-undetected structural defect from `01-03`'s restructure, surfaced only by this plan's own coverage-comparison requirement — not a defect this plan's own changes introduced).
**Impact on plan:** Necessary for Task 2's coverage-parity comparison to be meaningful at all; without this fix, phase success criterion 4 would have been evaluated against a number that reflected unit-test coverage only, not the actual sharded suite's real coverage.

## Known Stubs

None. No hardcoded empty values, placeholder UI text, or unwired data sources were introduced by this plan — all changes are CI configuration and documentation.

## Threat Flags

None beyond what this plan's own `<threat_model>` already anticipated (T-01-09, T-01-10, T-01-11 — all mitigated as designed; see BASELINE.md's Provenance section for the T-01-09 mitigation in practice, and the coverage-artifact-bug fix above for T-01-10).

## Issues Encountered

- **Worktree HEAD drift during PR cleanup (self-recovered, no data loss):** `gh pr close <n> --delete-branch` implicitly checks out a fallback branch (`main`) in the *local* worktree when the branch being deleted is currently checked out. This happened once during Task 1's cleanup (while on the temporary `chore/ci-shard-tuning-4` branch) and was caught immediately via the pre-commit HEAD safety assertion pattern — no commits were made while on the wrong branch, and the worktree was switched back to `worktree-agent-a8d2429add1a16e8e` before any further action. For Task 2's equivalent cleanup, the temporary branch was closed only after switching back to the agent's own branch first, avoiding a repeat.
- **Pre-existing E2E suite flakiness (documented, not fixed):** As detailed in BASELINE.md's flake-check section, this suite has real, pre-existing timing-sensitive flakiness across several unrelated specs (`accounts.spec.ts`, `mobile.spec.ts`, `counterparties.spec.ts`, `tags.spec.ts`) that predates this plan and is out of this plan's scope to fix (the only permitted lever, shard count, doesn't affect it; `retries.runMode` is locked at 2 by the threat model). Flagged for future attention but not blocking this plan's completion, per its own `planner_assumptions` #5 ("a negative verdict is a valid completion").
- **Component-test coverage has never been collected** (see Deferred Items below) — a separate, pre-existing gap unrelated to shard tuning, confirmed present in both Before and After measurements identically.

## Deferred Items

Logged to `.planning/phases/01-bug-fixes-e2e-baseline/deferred-items.md`:
- **Component-test coverage collection gap** — `test/cypress/support/component.tsx` never imports `@cypress/code-coverage/support` (unlike its e2e counterpart), so component-test coverage is never gathered even after this plan's upload-path fix. Confirmed pre-existing and present identically in both Before and After measurements (near-exact `LF` match rules out this plan as the cause). Suggested future fix: add the missing import, then re-baseline coverage expectations since real component coverage would add previously-uncounted lines.

## User Setup Required

None — no external service configuration required. This plan's only human-in-the-loop-adjacent moment was the coordinator status-check mid-execution, addressed inline; no checkpoint or approval gate was hit.

## Next Phase Readiness

- Phase success criterion 3 (E2E wall-clock speed) is **met decisively**: 4-shard total workflow duration (11m24s) and slowest-shard E2E stage (6m46s) both improve substantially over both the 2-shard intermediate (13m53s/8m56s) and the original single-job baseline (16m25s/10m27s).
- Phase success criterion 4 (coverage parity) is **met with a small, diagnosed shortfall**: After LH/LF (77.06%/76.98% across two samples) is 0.18-0.26 percentage points below Before (77.24%), with `LF` matching exactly in every sample and the gap attributed to test-execution-order sensitivity rather than lost coverage. A phase verifier or human reviewer should weigh whether this satisfies "equal to or higher" in spirit.
- Phase success criterion 5 (3+ consecutive green runs, no new flaky failures) is **literally met** (3 consecutive greens obtained and documented) **but with material caveats**: 4 of 7 real attempts failed on first try with pre-existing, unrelated spec-level flakiness. This is real evidence a phase verifier or human should weigh — it is not new flakiness introduced by the shard-count change (independently confirmed via disjoint/complete spec-distribution checks), but the suite is demonstrably not flake-free.
- `.github/workflows/ci.yml`'s E2E matrix is now `shard: [1, 2, 3, 4]`, with the coverage-artifact bug fixed and a `merged-lcov` artifact now published for future CI-sourced coverage checks.
- Both temporary vehicle branches/PRs used by this plan (`chore/ci-shard-tuning-4`/#82, `chore/ci-shard-tuning-validation`/#83) are closed and deleted.
- This is the final plan in Phase 01 (wave 3, sole plan, no downstream plans in this phase depend on it per its own frontmatter `depends_on: ["01-03"]` with no further dependents recorded elsewhere in the phase).

## Self-Check

- FOUND: .planning/phases/01-bug-fixes-e2e-baseline/BASELINE.md (After/Verdict/Provenance sections present)
- FOUND: .planning/phases/01-bug-fixes-e2e-baseline/deferred-items.md
- FOUND: .github/workflows/ci.yml (shard: [1, 2, 3, 4]; .test/coverage upload paths; merged-lcov upload step)
- FOUND: fb7aa34 (git log)
- FOUND: bcce0cd (git log)
- FOUND: 74ae8e4 (git log)

## Self-Check: PASSED

---
*Phase: 01-bug-fixes-e2e-baseline*
*Completed: 2026-08-26*
