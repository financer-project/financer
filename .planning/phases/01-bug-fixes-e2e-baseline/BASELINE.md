# CI E2E Suite Baseline (TEST-01, #71)

## Purpose

This document records the pre-change CI wall-clock time and merged LCOV line coverage
for the Cypress E2E suite, captured from real GitHub Actions runs, before the suite is
restructured into a sharded matrix (plan `01-04`). Every number below is read from a
named, linked GitHub Actions run — none is estimated, extrapolated, or timed locally
(D-11). The comparison in plan `01-04`'s "After" section is like-for-like: both the
before and after measurements run against the same 15-spec set, since plans `01-01`
and `01-02` (which each add a spec) were already merged into this branch before this
baseline was captured (see this plan's own "Ordering rationale").

## Before (sequential, single job)

| Metric | Value | Source |
|---|---|---|
| Total workflow wall-clock duration | **16m 25s** (15:42:26 -> 15:58:51 UTC) | Run `32867455261` |
| "Run E2E Tests" step duration | **10m 27s** (15:47:07 -> 15:57:34 UTC) | Run `32867455261` |
| Merged line coverage (LF/LH) | **77.24%** (LH `2956` / LF `3827`) | Run `32869899958`'s `.test/lcov.info` artifact (see note below) |
| E2E spec file count (`test/cypress/e2e/*.spec.ts`) | **15** | Counted in-tree at execution time (accounts, adminSettings, attachments, authentication, category, counterparties, formKeyboardNavigation, household, imports, mobile, onboarding, settings, tags, transactionTemplates, transactions) |
| Runner label | `ubuntu-latest` (`GitHub Actions 1000000449`) | Run `32867455261` |
| Commit SHA | `db3ef6c377194d2f4e602d194c114480c78f044e` | Both runs `32867455261` and `32869899958` were triggered from this same commit — `32869899958` only adds a non-functional `actions/upload-artifact` step for `.test/lcov.info` on top of it (see note below) |
| Workflow shape at time of baseline | Single job (`ci`, "Build, Check & Test") — sequential checkout -> install -> build -> lint -> unit -> component -> e2e -> merge -> Sonar | `.github/workflows/ci.yml` as of both runs |

**Note on the two source runs:** `32867455261` is the pure pre-change baseline run — its
`.github/workflows/ci.yml` was byte-identical to the phase-start workflow, and its
wall-clock and E2E-step durations above are taken directly from it. That run did not
publish `.test/lcov.info` as an artifact (no upload step existed yet), so its per-spec
`nyc` "Coverage summary" stdout only exposed statement coverage, not the merged
line-coverage (`LF`/`LH`) this document requires. A second run (`32869899958`) was
triggered by pushing one additional commit — adding only an
`actions/upload-artifact` step for `.test/lcov.info` after the existing "Merge
Coverage" step, with no other workflow or application change — so the merged coverage
artifact could be downloaded and its `LF`/`LH` totals computed exactly. That second
run's own wall-clock (15m 31s total, 9m 41s E2E step) is consistent with the first
run's numbers within normal CI run-to-run variance, confirming the artifact-upload
addition did not materially change the pipeline's performance profile. The **duration**
figures in the table above are taken from the first (purely unmodified) run; the
**coverage** figures are taken from the second (artifact-carrying) run, per the D-11
requirement that every figure be sourced from an actual CI run rather than
recalculated or assumed identical.

`LF`/`LH` were derived from the downloaded `.test/lcov.info`'s raw `DA:<line>,<hits>`
records (LF = count of `DA:` records = `3827`; LH = count of those records with a
hit count `> 0` = `2956`), since the merged file (produced by `lcov-result-merger`)
does not emit per-record `LF:`/`LH:` summary lines of its own — only the underlying
per-line hit data, which is the same information those summary lines would encode.

## After (sharded matrix)

_To be filled in by plan `01-04` after the sharded-matrix restructure lands and a
representative CI run has been captured under the new job graph._

## Verdict

_To be filled in by plan `01-04` once the "After" section above is complete — states
whether TEST-01's wall-clock and coverage-parity success criteria were met._

## Provenance

- Run `32867455261` (unmodified pre-change workflow): https://github.com/financer-project/financer/actions/runs/32867455261
- Run `32869899958` (same commit + one added artifact-upload step, used only to obtain the downloadable `.test/lcov.info`): https://github.com/financer-project/financer/actions/runs/32869899958
- Both runs were triggered via a temporary vehicle branch, `chore/ci-e2e-baseline`, and PR https://github.com/financer-project/financer/pull/80 (opened solely to trigger these CI runs; not intended to merge — closed and its branch deleted once this document was committed).
- Every number in the "Before" table above is attributable to one of the two run IDs listed here, per D-11.
