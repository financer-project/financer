# Deferred Items — Phase 01: Bug Fixes & E2E Baseline

Out-of-scope discoveries logged during plan execution, per the executor's scope-boundary rule
(fix only what the current task's changes directly caused or require).

## From plan 01-04 (CI shard tuning + coverage/flake validation)

### Component-test coverage is never collected

- **Found during:** Task 2, diagnosing why the merged LCOV coverage was far below the "Before"
  baseline after fixing the E2E/component coverage-artifact upload paths (see 01-04-SUMMARY.md).
- **Root cause:** `test/cypress/support/e2e.ts` imports `"@cypress/code-coverage/support"`
  (registering the client-side coverage-collection listener), but
  `test/cypress/support/component.tsx` does not. `cypress.config.ts`'s `component.setupNodeEvents`
  does register `codeCoverageTask(on, config)` server-side, and the component devServer's webpack
  config applies `babel-plugin-istanbul` instrumentation — but without the client-side support-file
  import, the plugin never receives coverage data from component-test runs to report.
- **Why deferred, not fixed:** This gap predates plan 01-04 and plan 01-03's CI restructuring —
  it is not something either plan introduced. Confirmed via a real CI run
  (`https://github.com/financer-project/financer/actions/runs/32887712546`): after fixing the
  upload-path bug, `e2e-coverage-shard-*` artifacts contained real data (~1.8-1.9MB each) but
  `component-coverage` remained empty (`No files were found with the provided path: .test/coverage.
  No artifacts will be uploaded.`) even with the corrected path. The resulting merged coverage
  (LF 3827 / LH 2949, 77.06%) matches the pre-change "Before" baseline (LF 3827 / LH 2956, 77.24%)
  almost exactly, confirming the "Before" figure was also computed from unit+e2e coverage only —
  component coverage has never been part of either measurement. Fixing it now would inflate
  "After" with no equivalent "Before" figure to compare against, breaking the like-for-like
  comparison BASELINE.md requires.
- **Suggested fix (future work):** Add `import "@cypress/code-coverage/support"` to
  `test/cypress/support/component.tsx`, then re-baseline coverage expectations since real
  component coverage would add previously-uncounted lines to both LF and LH.
- **Impact:** None on this plan's phase success criteria — the coverage-parity comparison remains
  fair since the gap is present identically in both measurements. Flagged for a future
  coverage-improvement effort, not blocking TEST-01.
