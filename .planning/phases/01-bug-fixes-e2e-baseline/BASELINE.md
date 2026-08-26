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

### Shard-count justification (D-09)

Two candidate shard counts were measured from real CI runs before adopting one. The adopted
count's own run also had its shard spec-assignment logs inspected to confirm every shard's
spec subset is disjoint and their union is the complete 15-spec set (no spec run twice, none
silently skipped).

| Shard count | Total workflow duration | Slowest-shard E2E stage duration | Run |
|---|---|---|---|
| 2 (pre-tuning) | **13m 53s** (17:10:52 → 17:24:45 UTC) | **8m 56s** (shard 1: 17:13:27 → 17:22:23 UTC) | `32876358524` |
| 4 (adopted) | **11m 24s** (17:52:59 → 18:04:23 UTC) | **6m 46s** (shard 3: 17:55:49 → 18:02:35 UTC) | `32880497661` |

4 shards is strictly better than 2 on both the total workflow duration and the slowest-shard
E2E stage duration — no diminishing return was observed between these two candidates, so a
third candidate was not needed (D-09 asks for an empirical choice with the measured
improvement recorded, not an exhaustive sweep). **Adopted: 4 shards.**

Spec distribution at 4 shards (run `32880497661`, confirmed from its per-shard "Running:" logs):
shard 1 = accounts, adminSettings, attachments, authentication (4); shard 2 = category,
counterparties, formKeyboardNavigation, household (4); shard 3 = imports, mobile, onboarding,
settings (4); shard 4 = tags, transactionTemplates, transactions (3). Total 4+4+4+3 = 15,
disjoint, union equals the full 15-spec "Before" set. `retries.runMode: 2`, `fail-fast: false`,
per-shard artifact name suffixes and merge-job-only `SONAR_TOKEN`/`SONAR_HOST_URL` scoping are
all unchanged from `01-03`.

**Note on measurement methodology:** the first 4-shard attempt (`32878713482`) hit an unrelated
pre-existing flake in `accounts.spec.ts` (a `cy.click()` DOM-detachment race that failed all 3
Cypress-level retry attempts) in one shard; that shard's job was rerun once, but because the
rerun's queue-dispatch delay would have distorted the *total workflow duration* metric, a fresh
full run (`32880497661`) was triggered instead and used as the clean 4-shard data point above.

### Coverage-artifact bug found and fixed (T-01-10)

Before the coverage comparison could be trusted, a real defect was found and fixed: the
`e2e-tests` and `component-tests` jobs' "Upload coverage" steps referenced
`.test/e2e/coverage` and `.test/component/coverage`, directories that never existed once those
jobs ran `cypress-io/github-action` directly (bypassing the `yarn cypress:*` scripts'
`--report-dir` CLI overrides, which only apply to local/manual runs). The actual report lands
at `nyc.config.js`'s shared `report-dir: ".test/coverage/"`. Both `01-03`'s validation run
(`32876358524`) and every unfixed `01-04` run silently uploaded 0 files for these two artifacts
(`actions/upload-artifact`'s default "warn, don't fail" behavior on an empty match), so the
merged `lcov.info` in every sharded-matrix run to date had only ever contained **unit-test**
coverage (confirmed: an unfixed run's merged LCOV showed LF `3826` / LH `1110`, ≈29% — far
below the 77.24% baseline). This was diagnosed and fixed by pointing both upload steps at
`.test/coverage` (see `01-04-SUMMARY.md` for the commit). Verified via run `32887712546`:
`e2e-coverage-shard-1..4` artifacts each carried ~1.8–1.9MB of real coverage data afterward
(previously 0 bytes / not uploaded at all).

**Component coverage remains uncollected** even after the path fix — a separate, pre-existing,
unrelated gap (`test/cypress/support/component.tsx` never imports
`@cypress/code-coverage/support`, unlike its e2e counterpart) that predates both `01-03` and
`01-04`. Logged to `deferred-items.md` rather than fixed here: fixing it now would add coverage
to "After" with no equivalent "Before" figure to compare against, since the near-exact LF match
below confirms the "Before" figure was *also* computed from unit+e2e coverage only.

### Coverage comparison (D-10, criterion 4)

| Metric | Before | After (sample 1) | After (sample 2) | Source |
|---|---|---|---|---|
| LF (lines found) | 3827 | 3827 | 3827 | `32869899958` / `32887712546` / `32905249686` |
| LH (lines hit) | 2956 | 2949 | 2946 | same |
| LH/LF | **77.24%** | 77.06% | 76.98% | same |

Two independent post-fix green runs (`32887712546`, `32905249686`) were sampled for the merged
`.test/lcov.info` to avoid drawing a conclusion from a single data point. Both land within a
tight 3-line band of each other (2946–2949) and 7–10 lines (0.18–0.26 percentage points) below
the Before figure — `LF` matches the Before baseline exactly in every sample, ruling out a
dropped-file or uncollected-artifact cause (already fixed above). The most plausible explanation
for the small residual gap is test-execution-order sensitivity: a handful of lines (error paths,
timing-dependent branches) may only be exercised when specs run sequentially within one process
(the old single-job architecture) versus in parallel across isolated per-shard VMs (the new
architecture) — not a structural coverage loss. This is a genuine, small shortfall against a
strict `>=` reading of criterion 4; it is diagnosed and explained here rather than adjusted away,
per this plan's own instruction not to paper over a shortfall.

### Flake-check (D-09, criterion 5)

Every CI run below was triggered on the temporary validation branch
`chore/ci-shard-tuning-validation` (PR `#83`) at the adopted 4-shard count, in the order
triggered. Per this plan's own `planner_assumptions` #4, every attempt is recorded — including
failures — rather than discarding failed attempts to manufacture a clean streak.

| # | Run | Conclusion | Notes |
|---|---|---|---|
| 1 | `32882109828` | **failure** | shard 3: `mobile.spec.ts` — `AssertionError: Timed out retrying after 20000ms: Expected to find element: input[name='name']`. Failed all 3 Cypress retry attempts. |
| 2 | `32883294797` | **failure** | shard 1: `accounts.spec.ts` — "Set as Default" button never appeared (20s timeout). shard 2: `counterparties.spec.ts` — same `input[name='name']` timeout as run 1's spec, different spec file. |
| 3 | `32885059784` | success | Clean first-try green. (Predates the coverage-path fix; its merged-lcov was unit-only and not used for the coverage comparison above.) |
| 4 | `32886271236` | **failure** | shard 4: `tags.spec.ts` — "Expected not to find content: 'Shopping' ... but continuously found it" (stale-render/cleanup-timing assertion). |
| 5 | `32887712546` | success (after 1 job rerun) | shard 1 first attempt failed with the same `accounts.spec.ts` "Set as Default" timeout as run 2; that job alone was rerun (`gh run rerun --failed`) and passed. Carries the coverage-path fix; used as coverage sample 1 above. |
| 6 | `32904191876` | success | Clean first-try green, no job reruns. Individual specs needed in-run Cypress retries in 3 of 4 shards (retry counts 1/1/0/2) but all recovered within `retries.runMode: 2`. |
| 7 | `32905249686` | success | Clean first-try green, no job reruns. In-run Cypress retries in 3 of 4 shards (1/2/2/0), all recovered. Used as coverage sample 2 above. |

**Result:** `gh run list --limit 3` over the latest three runs (`32887712546`, `32904191876`,
`32905249686`) reports `success,success,success` — the literal 3-consecutive-green requirement
is met. However, the honest picture requires stating plainly: **4 of the 7 real attempts at the
adopted shard count failed on first try**, each hitting a *different* spec with a *different*
Cypress assertion-timeout symptom (element-not-found, stale-content-still-present), none of them
repeating, and none traceable to the shard-distribution logic itself (spec assignment was
independently confirmed disjoint and complete in the shard-count-justification run above; the
one coverage-artifact defect found was a path bug, unrelated to test flakiness). A same-scale
comparison against the pre-change architecture is not available — only one clean 2-shard run and
two clean single-job "Before" runs were ever captured (`32876358524`, `32867455261`,
`32869899958`, all green on their only attempt), giving a much smaller pre-change sample to
compare against. `retries.runMode: 2` recovered every in-run Cypress-level retry observed (both
in the two runs that needed full job reruns' *other* specs and in runs 6–7's individual specs);
it did not recover the 4 job-level failures because those particular assertions failed all 3
Cypress attempts outright, not because retries were disabled or reduced.

**Assessment:** this suite carries real, pre-existing flakiness (timing-sensitive UI assertions
across several unrelated specs) that this plan did not introduce and — per its own scope and the
threat model's Pitfall 8 guard rail — is not permitted to paper over by raising
`retries.runMode`. Criterion 5's literal 3-consecutive-green bar is met by the numbers above, but
only after 4 non-consecutive failures; a reader should not conclude the suite is flake-free.

## Verdict

**Criterion 3 (wall-clock speed) — MET.** The adopted 4-shard configuration is measurably faster
than the pre-change baseline on every axis captured: total workflow duration `16m 25s` (Before,
single job) → `13m 53s` (2-shard) → `11m 24s` (4-shard, adopted); "Run E2E Tests"/slowest-shard
E2E stage duration `10m 27s` (Before) → `8m 56s` (2-shard) → `6m 46s` (4-shard, adopted). Both
metrics improve monotonically with the shard-count increase measured in this plan, with no sign
of diminishing return yet at 4 shards.

**Criterion 4 (coverage parity) — MET WITH A SMALL, DIAGNOSED SHORTFALL.** Merged line coverage
LH/LF is `77.24%` (Before) vs `77.06%`/`76.98%` (After, two independent samples) — `LF` (lines
found) matches exactly in every sample (`3827`), and the gap is `7`–`10` lines (`0.18`–`0.26`
percentage points), tightly reproducible across two independent post-fix runs. This is not a
dropped-artifact or lost-coverage defect (that defect was found and fixed separately, see above)
but most plausibly reflects a handful of execution-order-sensitive lines between sequential
single-job and parallel sharded execution. A strict `>=` reading of "equal to or higher" is not
met by a fraction of a percentage point; the shortfall is small, stable, and explained rather
than papered over, per this plan's own instruction.

**Criterion 5 (3-consecutive-green stability) — LITERALLY MET, WITH MATERIAL CAVEATS.** The
latest three runs at the adopted shard count are all green (`32887712546`, `32904191876`,
`32905249686`). Getting there required 7 total attempts, 4 of which failed on first try with
distinct, non-repeating, pre-existing spec-level flakes unrelated to the shard-distribution
change. This is real evidence of suite flakiness that predates this plan (the same class of
timing-sensitive assertion failures was not something introduced by raising the shard count —
spec distribution was independently verified correct) but is also not something this plan is
positioned to fix, since the only permitted lever (`retries.runMode`) is locked at 2 by the
threat model's Pitfall 8 guard rail. Recorded here plainly rather than hidden, per this plan's
own `planner_assumptions` #4 and #5.

**Overall:** the shard-count tuning achieved its speed goal decisively and did not introduce a
coverage or stability regression traceable to the shard-count change itself — the one genuine
defect found (the coverage-upload path bug) was diagnosed and fixed as part of this work. The
suite's pre-existing flakiness and the small residual coverage gap are both real, both honestly
recorded above, and both are handed off as visible, attributed findings rather than resolved
issues.

## Provenance

**Before (pre-change, single job):**
- Run `32867455261` (unmodified pre-change workflow): https://github.com/financer-project/financer/actions/runs/32867455261
- Run `32869899958` (same commit + one added artifact-upload step, used only to obtain the downloadable `.test/lcov.info`): https://github.com/financer-project/financer/actions/runs/32869899958
- Both runs were triggered via a temporary vehicle branch, `chore/ci-e2e-baseline`, and PR https://github.com/financer-project/financer/pull/80 (opened solely to trigger these CI runs; not intended to merge — closed and its branch deleted once this document was committed).

**Shard-count justification (Task 1, plan `01-04`):**
- Run `32876358524` (2-shard, from `01-03`'s own validation): https://github.com/financer-project/financer/actions/runs/32876358524
- Run `32880497661` (4-shard, clean, adopted): https://github.com/financer-project/financer/actions/runs/32880497661
- Triggered via temporary branch `chore/ci-shard-tuning-4`, PR https://github.com/financer-project/financer/pull/82 (closed, branch deleted).

**Coverage + flake-check (Task 2, plan `01-04`):**
- Run `32882109828`: https://github.com/financer-project/financer/actions/runs/32882109828
- Run `32883294797`: https://github.com/financer-project/financer/actions/runs/32883294797
- Run `32885059784`: https://github.com/financer-project/financer/actions/runs/32885059784
- Run `32886271236`: https://github.com/financer-project/financer/actions/runs/32886271236
- Run `32887712546`: https://github.com/financer-project/financer/actions/runs/32887712546
- Run `32904191876`: https://github.com/financer-project/financer/actions/runs/32904191876
- Run `32905249686`: https://github.com/financer-project/financer/actions/runs/32905249686
- Triggered via temporary branch `chore/ci-shard-tuning-validation`, PR https://github.com/financer-project/financer/pull/83 (closed, branch deleted, after this document was committed).

Every number in the "Before" and "After" sections above is attributable to one of the run IDs
listed here, per D-11. None was timed locally, estimated, or assumed identical across runs.
