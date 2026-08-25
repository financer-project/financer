---
phase: 01-bug-fixes-e2e-baseline
plan: 03
subsystem: testing
tags: [cypress, cypress-split, ci, github-actions, matrix, lcov, coverage, baseline, sonarqube]

# Dependency graph
requires:
  - phase: 01-01
    provides: "Counterparty filter regression spec (adds to the 15-spec E2E set measured in this baseline)"
  - phase: 01-02
    provides: "formKeyboardNavigation.spec.ts regression spec (adds to the 15-spec E2E set measured in this baseline)"
provides:
  - "Committed BASELINE.md with pre-change CI wall-clock duration and merged LCOV line coverage, each attributable to a named GitHub Actions run (D-10, D-11)"
  - "cypress-split@1.25.0 wired into cypress.config.ts's e2e setupNodeEvents for SPLIT/SPLIT_INDEX-driven spec distribution, plus video: false"
  - "5-job .github/workflows/ci.yml graph (build-and-lint -> unit-tests/component-tests/e2e-tests[2-shard matrix] -> merge-coverage-and-sonar) proven green end-to-end on a real CI run, with per-shard coverage/screenshot artifacts and secrets scoped only to the merge job"
affects: [01-04]

# Actuals (#2632)
actuals:
  tokens: 21000
  tasks: 3
  commits: 6

tech-stack:
  added: ["cypress-split@1.25.0"]
  patterns: ["GitHub Actions build matrix + cypress-split for CI-only test parallelization (no in-app runtime pattern)", "Per-shard-suffixed artifact naming to prevent overwrite collisions across matrix jobs"]

key-files:
  created:
    - .planning/phases/01-bug-fixes-e2e-baseline/BASELINE.md
  modified:
    - .github/workflows/ci.yml
    - cypress.config.ts
    - package.json
    - yarn.lock

key-decisions:
  - "Used two real CI runs to source the Before baseline rather than one: run 32867455261 (byte-identical pre-change workflow) for wall-clock duration, and run 32869899958 (same commit plus one added actions/upload-artifact step for .test/lcov.info, no other change) for merged line coverage, since the first run predated any lcov.info artifact upload. Both are cited in Provenance per D-11's 'no non-CI-sourced number' rule."
  - "Derived LF/LH totals directly from the downloaded lcov.info's raw DA:<line>,<hits> records (LF = count of DA records, LH = count with hits > 0) rather than relying on LF:/LH: summary lines, since lcov-result-merger's merged output does not emit its own per-record summary lines - only the underlying per-line hit data those lines would have encoded."
  - "Re-counted E2E spec files at execution time (15, not the planning-time assumption of 14) per planner_assumptions #5 - both 01-01 and 01-02 landed specs before this plan ran, confirming plan 01-03's own ordering rationale for running in wave 2."
  - "cypress-split@1.25.0 install was approved by the human at the Task 2 checkpoint (gate=blocking-human, never auto-approved regardless of auto-mode) before any install or config change was made."
  - "Every downstream job (unit-tests, component-tests, e2e-tests, merge-coverage-and-sonar) re-runs yarn install (cache-accelerated via the same deps-<os>-<yarn.lock-hash> key as build-and-lint) and, where a Prisma client is needed, its own yarn db:generate, rather than trying to inherit node_modules state via an artifact - matching the plan's own interface_context guidance that db:generate is cheap once deps are installed, and avoiding any assumption about exactly what actions/cache captured from build-and-lint's post-job save."
  - "Only e2e-tests downloads the .next/ build artifact from build-and-lint; unit-tests (vitest, no built app) and component-tests (Next.js webpack devServer, compiles on the fly) don't need it, matching how the original single job never needed a separate build step for those suites either."
  - "Closed temporary PR #80/branch chore/ci-e2e-baseline immediately after BASELINE.md was committed, and a second temporary PR #81/branch chore/ci-sharded-matrix-validation immediately after the sharded-matrix restructure was confirmed green - both are vehicles only, per the plan's own instruction, not meant to merge."

patterns-established:
  - "Give every per-shard CI artifact (coverage, screenshots) a name suffixed by the matrix key, so parallel matrix jobs never silently overwrite each other's uploaded output."

requirements-completed: [TEST-01]

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
  - id: D2
    description: "cypress-split@1.25.0 is installed and wired into cypress.config.ts's e2e setupNodeEvents (SPLIT/SPLIT_INDEX-driven spec distribution); retries.runMode stays at 2; video is disabled"
    requirement: "TEST-01"
    verification:
      - kind: other
        ref: "grep -c 'cypress-split' cypress.config.ts (returns 1)"
        status: pass
      - kind: other
        ref: "grep -Eq 'runMode:[[:space:]]*2' cypress.config.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: ".github/workflows/ci.yml is restructured into 5 named jobs (build-and-lint, unit-tests, component-tests, e2e-tests, merge-coverage-and-sonar); e2e-tests is a fail-fast:false, 2-shard matrix; SONAR_TOKEN/SONAR_HOST_URL appear only in merge-coverage-and-sonar"
    requirement: "TEST-01"
    verification:
      - kind: other
        ref: "grep -n '^  build-and-lint:\\|^  unit-tests:\\|^  component-tests:\\|^  e2e-tests:\\|^  merge-coverage-and-sonar:' .github/workflows/ci.yml (all 5 present)"
        status: pass
      - kind: other
        ref: "SONAR_TOKEN/SONAR_HOST_URL grep lines all fall within merge-coverage-and-sonar's line range"
        status: pass
    human_judgment: false
  - id: D4
    description: "A real CI run passes the entire 5-job graph green: two E2E shards run disjoint spec subsets whose union is the full 15-spec set, per-shard coverage/screenshot artifacts don't collide, and SonarQube runs exactly once against the merged lcov.info"
    requirement: "TEST-01"
    verification:
      - kind: other
        ref: "gh run view 32876358524 --repo financer-project/financer (conclusion: success, all 6 jobs success)"
        status: pass
      - kind: other
        ref: "Shard 1 log 'Running:' lines: accounts, adminSettings, attachments, authentication, category, counterparties, formKeyboardNavigation, household (8 specs); Shard 2: imports, mobile, onboarding, settings, tags, transactionTemplates, transactions (7 specs) - disjoint, union = all 15"
        status: pass
      - kind: other
        ref: "merge-coverage-and-sonar job log: single 'Run sonarsource/sonarqube-scan-action@v4' group, 'ANALYSIS SUCCESSFUL' / 'EXECUTION SUCCESS'"
        status: pass
    human_judgment: false
  - id: D5
    description: "test/utility/TestUtilityDBContainer.ts is untouched by the restructure - per-shard MySQL/Redis isolation comes from each matrix job's own VM (D-08), not a code change"
    requirement: "TEST-01"
    verification:
      - kind: other
        ref: "git diff db3ef6c377194d2f4e602d194c114480c78f044e HEAD -- test/utility/TestUtilityDBContainer.ts (empty output)"
        status: pass
    human_judgment: false

duration: 95min
completed: 2026-08-25
status: complete
---

# Phase 1 Plan 3: CI E2E Baseline Capture & Sharded Matrix Restructure Summary

**Recorded the pre-change CI baseline (16m25s wall-clock, 10m27s E2E step, 77.24% merged line coverage) into a committed BASELINE.md, then restructured `.github/workflows/ci.yml` into a 5-job graph with a 2-shard `cypress-split`-driven E2E matrix, proven green end-to-end on a real GitHub Actions run after fixing one CI-only bug (`actions/upload-artifact@v5`'s default hidden-file exclusion silently dropping the `.next/` build artifact).**

## Performance

- **Duration:** 95 min total across two dispatches (this is a retry of a prior attempt that lost its worktree mid-poll with zero commits; this dispatch handled Task 1, halted cleanly at Task 2's checkpoint, then resumed after human approval through Task 3)
- **Started:** 2026-08-25T16:00:00Z (approx, first dispatch)
- **Completed:** 2026-08-25T17:35:00Z (approx, final commit)
- **Tasks:** 3 of 3 completed
- **Files modified:** 5 (1 created, 4 modified)

## Accomplishments

- Confirmed the prior attempt's already-triggered baseline run (`32867455261`, on `chore/ci-e2e-baseline` / PR #80, head `db3ef6c3`) was still valid: `success`, byte-identical single-job workflow, 16m25s total / 10m27s "Run E2E Tests" step.
- Closed the coverage-artifact gap the prior attempt had identified: added a single `actions/upload-artifact` step for `.test/lcov.info` to `.github/workflows/ci.yml`, pushed one commit to the same temporary branch, and captured a second run (`32869899958`, success, 15m31s total / 9m41s E2E step - consistent with the original within normal CI variance).
- Downloaded that run's `.test/lcov.info` artifact and computed merged line coverage directly from its `DA:` records: LF `3827`, LH `2956`, **77.24%**.
- Re-counted E2E spec files in-tree: **15** (`test/cypress/e2e/*.spec.ts`), confirming planner_assumptions #5.
- Wrote and committed `.planning/phases/01-bug-fixes-e2e-baseline/BASELINE.md` with the "Before" table, empty "After"/"Verdict" sections reserved for plan `01-04`, and a "Provenance" section linking both source runs and PR #80. Closed PR #80 and deleted `chore/ci-e2e-baseline`.
- Halted cleanly at Task 2 (`checkpoint:human-verify`, `gate="blocking-human"` for `cypress-split@1.25.0`'s package legitimacy) and resumed only after the human responded "approved".
- Installed `cypress-split@1.25.0` and registered `cypressSplit(on, config)` in `cypress.config.ts`'s `e2e.setupNodeEvents`, alongside the existing `codeCoverageTask` call and before the existing `return config`; added `video: false`. `retries.runMode: 2`, the `TestUtilityDBContainer` wiring, all four `on("task", ...)` handlers, and the `before:run`/`after:run` hooks are unchanged.
- Restructured `.github/workflows/ci.yml` into 5 jobs: `build-and-lint` (uploads `.next/` as a build artifact), `unit-tests`, `component-tests`, `e2e-tests` (fail-fast:false, 2-shard matrix, `SPLIT`/`SPLIT_INDEX` sourced from `strategy.job-total`/`strategy.job-index`, per-shard-suffixed coverage and screenshot artifacts), and `merge-coverage-and-sonar` (downloads every `*-coverage*` artifact, runs `yarn coverage:merge`, then the two unchanged SonarQube steps). `SONAR_TOKEN`/`SONAR_HOST_URL` now live only on `merge-coverage-and-sonar`.
- Pushed the restructure to a temporary validation branch/PR (`chore/ci-sharded-matrix-validation`, PR #81) and watched the triggered run: both `e2e-tests` shards **failed** with `Artifact not found for name: next-build`.
- Diagnosed the failure from `build-and-lint`'s own log: `actions/upload-artifact@v5` defaults to `include-hidden-files: false`, and `.next` is itself a dot-directory, so the "Upload build output" step silently uploaded zero files (`No files were found with the provided path: .next. No artifacts will be uploaded.` - a warning, not a hard failure, so `build-and-lint` still reported success). Fixed by adding `include-hidden-files: true` to that upload step (Rule 1 - bug, see Deviations below).
- Pushed the fix to the same validation branch and watched the re-triggered run: **all 6 jobs green** (`32876358524`, 13m53s). Verified from the logs that shard 1 ran 8 specs (accounts, adminSettings, attachments, authentication, category, counterparties, formKeyboardNavigation, household) and shard 2 ran the other 7 (imports, mobile, onboarding, settings, tags, transactionTemplates, transactions) - disjoint, union = all 15 specs, no spec run twice or skipped. Confirmed exactly one SonarQube execution (`ANALYSIS SUCCESSFUL`, `EXECUTION SUCCESS`) against the merged `lcov.info`.
- Closed PR #81 and deleted `chore/ci-sharded-matrix-validation` now that the restructure is validated.

## Task Commits

Each task was committed atomically:

1. **Task 1 (part 1 of 2): Add the missing lcov.info artifact-upload step** - `3ab9959` (chore)
2. **Task 1 (part 2 of 2): Record the pre-change CI baseline** - `8c3ff36` (docs)
3. **Checkpoint halt summary (first dispatch return)** - `7591288` (docs) - superseded by this SUMMARY
4. **Task 3 (part 1 of 2): Wire cypress-split for E2E matrix spec distribution** - `0126e36` (feat) - human-approved install per Task 2's checkpoint
5. **Task 3 (part 2 of 2): Restructure CI into a sharded E2E matrix + merge job** - `9f2fa5c` (feat)
6. **Task 3 (fix): Include hidden .next files in the build artifact upload** - `770d0ac` (fix)

_Task 2 itself (`checkpoint:human-verify`, `gate="blocking-human"`) produced no commit - it was resolved by the human's "approved" response between dispatches, exactly as the checkpoint protocol requires._

## Files Created/Modified

- `.planning/phases/01-bug-fixes-e2e-baseline/BASELINE.md` (created) - Pre-change CI wall-clock and merged LCOV coverage baseline, with Before/After/Verdict/Provenance sections (After/Verdict left empty for plan `01-04`).
- `.github/workflows/ci.yml` (modified) - Restructured from a single `ci` job into 5 jobs (`build-and-lint`, `unit-tests`, `component-tests`, `e2e-tests`, `merge-coverage-and-sonar`), with a 2-shard `fail-fast: false` E2E matrix, per-shard-suffixed artifacts, `SONAR_TOKEN`/`SONAR_HOST_URL` scoped only to the merge job, and `include-hidden-files: true` on the `.next/` build-artifact upload.
- `cypress.config.ts` (modified) - Added `cypress-split` import and `cypressSplit(on, config)` registration in the `e2e` block's `setupNodeEvents`; added `video: false`. `retries.runMode: 2` and all `TestUtilityDBContainer`/task/hook wiring unchanged.
- `package.json` / `yarn.lock` (modified) - Added `cypress-split@1.25.0` devDependency.

## Decisions Made

See `key-decisions` in the frontmatter above for full detail. Summary:
- Sourced duration numbers from the original (unmodified) baseline run and coverage numbers from a second (artifact-carrying) run, both cited in `BASELINE.md`'s Provenance.
- Derived LF/LH from raw `DA:` records since the merged lcov file carries no per-record summary lines.
- Only `e2e-tests` downloads the `.next/` build artifact; `unit-tests`/`component-tests` don't need a built app.
- Every downstream job re-installs deps (cache-accelerated) and re-runs `yarn db:generate` rather than assuming a specific cache/artifact inheritance chain for the generated Prisma client.
- Closed both temporary vehicle PRs/branches (#80 and #81) immediately after their respective purposes were served.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added `include-hidden-files: true` to the `.next/` build-artifact upload step**
- **Found during:** Task 3, first real-CI validation run (`32875493737` on temporary PR #81) - both `e2e-tests` shards failed at "Download build output" with `Artifact not found for name: next-build`.
- **Issue:** `actions/upload-artifact@v5` defaults to `include-hidden-files: false`. `.next` is itself a dot-directory, so the "Upload build output" step in `build-and-lint` matched zero files and silently uploaded nothing - logged only as a warning (`No files were found with the provided path: .next. No artifacts will be uploaded.`), so `build-and-lint` still reported `success` while producing an empty artifact. This is a CI-platform-specific gotcha with no code-review-visible symptom; it only surfaces at actual-run time, exactly what Task 3's tracer-style "push and watch one full run" step exists to catch.
- **Fix:** Added `include-hidden-files: true` to the "Upload build output" step in `.github/workflows/ci.yml`.
- **Files modified:** `.github/workflows/ci.yml`
- **Verification:** Re-pushed to the same validation branch; re-triggered run `32876358524` passed all 6 jobs, including both E2E shards successfully downloading and using the `.next/` build.
- **Committed in:** `770d0ac`

---

**Total deviations:** 1 auto-fixed (CI-platform default-behavior bug surfaced only by the mandated real-run validation, not a design or logic error in the restructure itself).
**Impact on plan:** Necessary for Task 3's own acceptance criteria (a genuinely green CI run) to hold. No scope creep - the fix touched only the one upload step that was broken.

## Issues Encountered

- The prior executor dispatch for this same plan lost its worktree mid-task while polling the first CI run (`32867455261`), before making any commits or file edits. This dispatch started fresh but reused the prior attempt's already-observed run data (per the orchestrator's `<prior_attempt_data>`) rather than re-triggering a redundant first run.
- SonarQube's analysis log for the successful sharded run shows `WARN Could not resolve 13 file paths in [.../.test/lcov.info]` - a pre-existing-style path-resolution nuance in how Sonar cross-references the merged LCOV file's paths against its own project layout, not new to this restructure (Sonar still reported `ANALYSIS SUCCESSFUL`/`EXECUTION SUCCESS`). Not investigated further as it doesn't block any of this task's acceptance criteria; noted here for visibility in case plan `01-04`'s "After" coverage comparison needs it.
- `yarn add -D cypress-split@1.25.0` produced a native-module build failure for `cpu-features` (a transitive dependency of `ssh2`, itself an existing transitive dependency of Testcontainers, unrelated to `cypress-split`) - confirmed pre-existing via `git diff` showing zero new `ssh2`/`cpu-features` lines in the `yarn.lock` diff, and a Windows-only native-addon build issue that doesn't affect the `ubuntu-latest` CI runner. Out of scope per the deviation rules' scope boundary; not fixed.

## User Setup Required

None - no external service configuration required. The Task 2 package-legitimacy checkpoint was the only human-in-the-loop step, and it has been resolved (approved).

## Next Phase Readiness

- Phase success criteria 3 and 4's "before" comparison point is fully captured and durable in `BASELINE.md` (16m25s / 10m27s / 77.24% merged coverage / 15 specs / `ubuntu-latest` / commit `db3ef6c3`).
- The sharded-matrix architecture (D-07/D-08) is proven green end-to-end on a real CI run: `build-and-lint -> {unit-tests, component-tests, e2e-tests[2 shards]} -> merge-coverage-and-sonar`, with disjoint E2E spec subsets, per-shard database isolation via VM-level separation (no `TestUtilityDBContainer.ts` change), per-shard-suffixed artifacts, and exactly one SonarQube execution against a fully merged `lcov.info`.
- Plan `01-04` can now fill in `BASELINE.md`'s "After (sharded matrix)" and "Verdict" sections once it captures a representative run's wall-clock/coverage numbers under the new job graph, and can tune the shard count (currently 2, comment in `ci.yml` records the "stay at or below spec count" constraint) if a different shard count better trades off runner overhead against wall-clock improvement.
- Both temporary vehicle branches/PRs (`chore/ci-e2e-baseline`/#80 and `chore/ci-sharded-matrix-validation`/#81) have been closed and deleted - plan `01-04` will need a fresh branch/PR if another real CI run is needed to validate its own changes.
- `test/utility/TestUtilityDBContainer.ts` remains byte-identical to its phase-start state, confirmed by `git diff` against the phase-start commit.

## Self-Check

- FOUND: .planning/phases/01-bug-fixes-e2e-baseline/BASELINE.md
- FOUND: cypress.config.ts (modified, cypress-split import + registration + video:false present)
- FOUND: .github/workflows/ci.yml (modified, 5 named jobs, matrix, include-hidden-files:true present)
- FOUND: 3ab9959 (git log)
- FOUND: 8c3ff36 (git log)
- FOUND: 7591288 (git log)
- FOUND: 0126e36 (git log)
- FOUND: 9f2fa5c (git log)
- FOUND: 770d0ac (git log)

## Self-Check: PASSED

---
*Phase: 01-bug-fixes-e2e-baseline*
*Completed: 2026-08-25*
