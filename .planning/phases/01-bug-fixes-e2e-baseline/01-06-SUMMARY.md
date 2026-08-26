---
phase: 01-bug-fixes-e2e-baseline
plan: 06
subsystem: testing
tags: [vitest, coverage, lcov, istanbul, ci]

# Dependency graph
requires:
  - phase: 01-bug-fixes-e2e-baseline
    provides: "01-04's sharded E2E CI matrix and its merged-LCOV coverage artifacts, and BASELINE.md's Before/After coverage-comparison table this plan investigates"
provides:
  - "An enumerated, named 10-line coverage drop table (file + line + source text + classification) replacing 01-VERIFICATION.md gap 2's unnamed '7-10 lines, most plausibly execution-order-sensitive' hand-wave"
  - "A reconciliation of the previously-unexplained 7-vs-10 spread: the drop set is a stable, identical 10 lines in both After samples; the spread was 3 unrelated gained lines in src/app/error.tsx in one sample only"
  - "Three new deterministic Vitest unit tests (formatFileSize, UserFormatter, cn) closing previously zero-coverage pure logic, raising local unit LH from 1110 to 1122 with LF unchanged at 3826"
  - "A per-line, individually-reasoned uncloseable classification for all 10 named drop-table lines, handed to plan 01-07's checkpoint"
affects: ["01-07 (verdict rewrite + human checkpoint on the residual coverage gap)"]

# Actuals (#2632)
actuals:
  tokens: 6500
  tasks: 2
  commits: 2

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "LCOV DA-record diffing (Before hit / After unhit) as a scriptable, throwaway-Node technique for naming an unexplained coverage delta instead of describing it in prose"
    - "Empirical local-coverage probing (.test/unit/coverage/lcov.info per-file DA inspection) to distinguish 'module-scope statement, hit merely by import' from 'function-body statement, hit only when actually invoked' before deciding whether a line is unit-testable"

key-files:
  created:
    - test/vitest/lib/util/utils.test.ts
  modified:
    - test/vitest/lib/util/formatter/formatter.test.ts
    - .planning/phases/01-bug-fixes-e2e-baseline/BASELINE.md

key-decisions:
  - "All 10 named drop-table lines are JSX-embedded callbacks (onClick handlers, Array.sort comparators) inside React component render bodies — reachable only through a real DOM render pass, not through module import or direct function invocation. None are unit-testable without adding @testing-library/react, enabling a jsdom vitest environment, or extracting logic into an exported src/ function — all three are outside this task's file-scope (test/vitest/** and BASELINE.md only, package.json and vitest.config.ts must stay byte-identical)."
  - "Since the named lines could not be closed, local unit LH was raised above the 10-line union size via real, assertion-bearing tests on three previously zero-coverage pure functions (formatFileSize, UserFormatter.format, cn) — the same 'numeric bar satisfied without explaining the original drop' outcome the plan's own text prescribes for the expired-artifact fallback path, applied here because the drop-table lines are provably unreachable rather than because an artifact expired."
  - "yarn tsc --noEmit fails on 2 pre-existing errors in files this plan never touched (test/cypress/e2e/mobile.spec.ts, test/vitest/app/api/transactions/attachments/attachmentRoutes.test.ts) — confirmed pre-existing and out of this task's scope per the executor's scope-boundary rule; not fixed, flagged for the phase verifier and plan 01-07."

patterns-established:
  - "When a task's file-scope forbids the changes needed to close a coverage gap (new deps, config, src/ exports), name the individual reason per line rather than force a superficial closure, and satisfy any numeric coverage floor via real, unrelated deterministic tests instead."

requirements-completed: [TEST-01]

coverage:
  - id: D1
    description: "The exact source lines dropped from merged coverage after E2E sharding are enumerated by file/line/source-text/classification in BASELINE.md, replacing the prior unnamed 7-10 line hand-wave"
    requirement: "TEST-01"
    verification:
      - kind: other
        ref: "BASELINE.md 'Coverage gap-closure investigation (plan 01-06)' section — drop table with 10 named rows, integrity checks, and recomputed LH totals (2956/2949/2946) matching the pre-existing baseline"
        status: pass
    human_judgment: false
  - id: D2
    description: "Each named dropped line is either newly covered by a real behavioural test, or carries an individual written reason it cannot be deterministically covered within this task's scope"
    requirement: "TEST-01"
    verification:
      - kind: other
        ref: "BASELINE.md 'Coverage gap-closure outcome (plan 01-06, Task 2)' per-line reason table (all 10 rows) plus the 3-function unit-test closure table"
        status: pass
    human_judgment: false
  - id: D3
    description: "Coverage measurement machinery (nyc.config.js, vitest.config.ts, cypress.config.ts, package.json) is provably untouched, and no coverage-suppression pragma was introduced"
    requirement: "TEST-01"
    verification:
      - kind: unit
        ref: "git diff --exit-code -- nyc.config.js vitest.config.ts cypress.config.ts package.json (no output); grep -rc 'istanbul ignore' src/ | grep -v ':0$' | wc -l (0)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Whether the residual 10-line coverage gap should be accepted as-is or closed via an expanded-scope follow-up (new test dependency or jsdom environment) is a decision, not an automatable outcome"
    verification: []
    human_judgment: true
    rationale: "Closing the 10 named lines requires either a new runtime dependency (@testing-library/react), a vitest.config.ts environment change (jsdom), or extracting render-body logic into exported src/ functions — all three are scope/architecture decisions this task is explicitly not authorized to make; deferred to plan 01-07's checkpoint per this plan's own planner_assumptions #7."

# Metrics
duration: 95min
completed: 2026-08-26
status: complete
---

# Phase 01 Plan 06: Coverage Gap-Closure Investigation Summary

**Enumerated the exact 10 source lines dropped from merged E2E coverage after sharding (all JSX-embedded, browser-only callbacks), reconciled the baseline's 7-vs-10 spread, and closed the numeric shortfall via 15 new deterministic Vitest tests on previously zero-coverage pure formatter/util logic.**

## Performance

- **Duration:** 95 min
- **Started:** 2026-08-26T13:40:00Z (approx.)
- **Completed:** 2026-08-26T15:15:00Z (approx.)
- **Tasks:** 2
- **Files modified:** 3 (2 test files, 1 doc)

## Accomplishments

- Downloaded and diffed the Before / After-sample-1 / After-sample-2 merged LCOV artifacts from the three named CI runs (`32869899958`, `32887712546`, `32905249686`), confirming identical `SF:` path sets, matching per-file `DA:` counts, and `LF=3827` in all three — the samples are directly, line-for-line comparable.
- Named the exact 10-line drop set (identical in both After samples — the drop itself is stable, not the "7-vs-10 execution-order-sensitive" instability the baseline speculated). Reconciled the spread: it was 3 unrelated lines in `src/app/error.tsx` gained in After sample 1 only, not instability in the drop set itself.
- Classified all 10 lines as browser-only behaviour (JSX `onClick` handlers and `Array.sort` comparators inside React render bodies) with a documented, empirically-checked technical reason each cannot be reached by import or direct function invocation.
- Added 15 new tests across 3 previously zero-coverage pure functions (`formatFileSize`, `UserFormatter.format`, `cn`), each verified to fail against a deliberate source break before being reverted, raising local unit LH from 1110 to 1122 (LF unchanged at 3826) — exceeding the 10-line union-size bar.
- Left the ten drop-table lines open with individually-reasoned closure blockers, correctly handing the scope-expansion decision (new test dependency vs. accept the gap) to plan `01-07`'s checkpoint rather than silently working around this task's file-scope restrictions.

## Task Commits

Each task was committed atomically:

1. **Task 1: Enumerate the exact source lines that stopped being covered, and record them in BASELINE.md** - `dd93324` (docs)
2. **Task 2: Cover the enumerated lines deterministically, or classify each one as uncloseable with a reason** - `d725fea` (test)

_No plan-metadata commit is included here — per this worktree's isolation instructions, STATE.md/ROADMAP.md are not touched by this agent; the orchestrator handles the final metadata commit after merge._

## Files Created/Modified

- `test/vitest/lib/util/utils.test.ts` - New: 5 tests for `cn()`, including a `twMerge`-specific Tailwind-conflict-resolution assertion
- `test/vitest/lib/util/formatter/formatter.test.ts` - Extended: new `UserFormatter` (2 tests) and `formatFileSize` (8 tests) describe blocks
- `.planning/phases/01-bug-fixes-e2e-baseline/BASELINE.md` - Two new subsections: "Coverage gap-closure investigation (plan 01-06)" (Task 1's enumeration/classification) and "Coverage gap-closure outcome (plan 01-06, Task 2)" (per-line reasons + closure numbers); plus a short Provenance addendum confirming the three run IDs used were already listed

## Decisions Made

- Treated all 10 drop-table lines as browser-only rather than attempting a workaround (e.g. importing modules without asserting real behaviour, which the plan explicitly prohibits as "a test whose only effect is to execute a line"). This was verified empirically against the current local `.test/unit/coverage/lcov.info`, not assumed.
- Chose to raise local LH via genuinely under-tested pure logic (`formatFileSize`, `UserFormatter`, `cn`) rather than leaving the numeric bar unmet, mirroring the plan's own prescribed fallback-path behaviour, since the named lines were provably unreachable within scope.
- Did not attempt to fix the two pre-existing `yarn tsc --noEmit` errors (unrelated files, pre-existing before this plan's changes) — out of scope per the scope-boundary rule.

## Deviations from Plan

### Auto-fixed Issues

None — no bugs, missing critical functionality, or blocking issues were introduced or discovered in files this plan touched.

### Notable non-fixes (documented per plan instruction, not deviations)

**1. `yarn tsc --noEmit` fails on 2 pre-existing errors unrelated to this plan**
- **Found during:** Task 2 verification
- **Issue:** `test/cypress/e2e/mobile.spec.ts:82` (a `JQuery<HTMLElement>`-to-`string` type cast) and `test/vitest/app/api/transactions/attachments/attachmentRoutes.test.ts:81,111` (a test fixture missing the `transactionTemplateId` field, likely from an earlier phase-01 Prisma schema change) fail type-checking. Neither file was touched by this plan.
- **Action:** Not fixed — outside this task's scope-boundary (unrelated files, pre-existing before this plan ran). Confirmed neither new test file appears in the error output. Documented in BASELINE.md's outcome section and here for the phase verifier and plan `01-07`'s checkpoint.

---

**Total deviations:** 0 auto-fixed; 1 pre-existing out-of-scope issue documented (not fixed).
**Impact on plan:** None on this plan's own deliverables — the pre-existing `tsc` failure does not affect this plan's Vitest additions or BASELINE.md updates, but it does mean the phase-wide `yarn tsc --noEmit` gate is not currently green for reasons unrelated to this plan.

## Issues Encountered

- **Fresh worktree had no `node_modules` or generated Prisma client.** Running `yarn install` (lockfile-respecting, no new packages) and `yarn db:generate` (`prisma generate`) was required before any Vitest run would succeed. Neither changed `yarn.lock` or any tracked file (verified via `git status`).
- **A long-running `yarn test:unit` invocation caused a mid-session stream stall** (blocking Bash call with no output for several minutes). Recovered by re-confirming the completed run's captured log and switching to the background+poll pattern for the subsequent `yarn tsc --noEmit` check. No work was lost; the working tree was already clean of stray diffs at the stall point.
- **Deep investigation was required to determine unit-testability.** Initial hypothesis (that some drop-table lines, e.g. `ImportWizard.tsx:51`'s module-scope schema statement, might be closeable by a plain import) was checked empirically against the current local LCOV and rejected — module-scope import alone would satisfy the coverage counter but not the plan's "must assert real behaviour" prohibition, and the schema in question is unexported and never actually parsed at runtime.

## Known Stubs

None.

## Threat Flags

None — no new network endpoint, auth path, file-access pattern, or schema change was introduced. All four coverage-configuration files (`nyc.config.js`, `vitest.config.ts`, `cypress.config.ts`, `package.json`) are confirmed byte-identical (T-01-17 mitigated). Every new test asserts real behaviour and was observed failing against a deliberate break before being reverted (T-01-18 mitigated, see BASELINE.md's teeth-check table). Every figure in BASELINE.md's new sections names its source run ID (T-01-19 mitigated). No coverage artifact was committed — scratch downloads and the parsing script were kept outside the repository and deleted before the final commit (T-01-20 mitigated).

## Next Phase Readiness

- `01-07` has a fully named, reasoned residual: 10 specific browser-only lines, each with a documented reason it cannot be closed without a scope-expanding dependency/config change. `01-07`'s checkpoint can now present a human with a concrete decision (accept the ~0.26pp gap vs. add `@testing-library/react`/`jsdom`) instead of an unnamed hand-wave.
- The local unit-coverage numeric bar (LH rose by more than the union size) is met and documented; the authoritative merged-coverage figure still requires a fresh CI run, which is `01-07`'s job.
- The pre-existing `yarn tsc --noEmit` failure (2 errors, unrelated files) should be surfaced to `01-07`'s checkpoint or the phase verifier, since it affects the phase-wide type-check gate independent of this plan.

## Self-Check: PASSED

- FOUND: `test/vitest/lib/util/utils.test.ts`
- FOUND: `test/vitest/lib/util/formatter/formatter.test.ts`
- FOUND: `.planning/phases/01-bug-fixes-e2e-baseline/01-06-SUMMARY.md`
- FOUND commit: `dd93324` (Task 1)
- FOUND commit: `d725fea` (Task 2)
- FOUND commit: `41b18d0` (SUMMARY)

---
*Phase: 01-bug-fixes-e2e-baseline*
*Completed: 2026-08-26*
