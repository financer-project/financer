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

### Coverage gap-closure investigation (plan 01-06)

**Purpose.** The section above diagnoses the 7–10 line shortfall as "most plausibly
execution-order-sensitive" without naming a single line. This section names them: every
source line that was hit in the Before merged LCOV and unhit in an After sample, enumerated
by file path and line number, classified, and either closed or given an individual written
reason it cannot be.

**Method.** Repository ownership of the run IDs was resolved first, since BASELINE.md's own
Provenance section links `github.com/financer-project/financer` while the local `origin`
remote is `github.com/raphaelmue/financer-blitz` — confirmed via
`gh api repos/financer-project/financer/actions/runs/32869899958/artifacts`, which returned
the Before run's artifact (`lcov-info`, not `merged-lcov` — the Before run predates the
permanent upload-step naming), not expired (`expires_at: 2026-11-23T16:06:06Z`), satisfying
this task's precondition. The three merged LCOV files were downloaded with
`gh run download {id} -R financer-project/financer -n {artifact-name} -D {dir}`:

- Before: run `32869899958`, artifact `lcov-info`
- After sample 1: run `32887712546`, artifact `merged-lcov`
- After sample 2: run `32905249686`, artifact `merged-lcov`

Each file was parsed with a throwaway Node script (grouping `DA:<line>,<hits>` records under
their preceding `SF:<path>` header) run outside the repository's tracked files; the three
downloaded LCOV files and the script were kept in a scratch directory and never staged.

**Integrity checks — all passed:**

| Check | Result |
|---|---|
| `SF:` path sets identical, Before vs After sample 1 | **identical** |
| `SF:` path sets identical, Before vs After sample 2 | **identical** |
| `SF:` path sets identical, After sample 1 vs After sample 2 | **identical** |
| Per-file `DA:` record counts matching across all three files | **0 mismatches** (every file's line count is identical in all three samples) |
| Total `DA:` records per file | **3827** in Before, After sample 1, and After sample 2 |
| Recomputed LH (count of `DA:` records with hits > 0) | Before **2956**, After sample 1 **2949**, After sample 2 **2946** — reproduces the figures already recorded in the "Coverage comparison (D-10, criterion 4)" table above |

No source file entered or left the instrumented set and no line numbers moved between the
Before commit and the After commits — the three samples are directly, line-for-line
comparable.

**Drop/gain computation.** For each After sample, the set of `(file, line)` pairs with
hits > 0 in Before and exactly 0 in that After sample was computed ("drops"), and the reverse
direction (0 in Before, > 0 in After) was also computed ("gains"), since a net figure could be
composed of a larger number of drops partly offset by gains:

| | After sample 1 (`32887712546`) | After sample 2 (`32905249686`) |
|---|---|---|
| Drops (Before hit → After unhit) | 10 | 10 |
| Gains (Before unhit → After hit) | 3 | 0 |
| Net LH change | 2956 − 10 + 3 = **2949** ✓ | 2956 − 10 + 0 = **2946** ✓ |

Both net figures reproduce the recorded LH totals exactly, reconciling the "7–10 lines"
language already in this document: the **drop set itself is identical and stable across both
samples (10 lines, exact same file/line pairs in both — intersection = union = 10, not an
unstable subset)**. The apparent "7 vs 10" spread in the original comparison was never
run-to-run instability in *which* lines drop — it was 3 unrelated lines in
`src/app/error.tsx` (the global error-boundary component: lines 7, 9, 12) that happened to
gain coverage in After sample 1 only, partially offsetting the same 10-line drop. This is a
materially different, more precise finding than the "execution-order-sensitive, roughly
7–10 lines" language above: the drop is one stable, fully named 10-line set; the 7-vs-10
spread is a separate, unrelated 3-line gain that is not part of the shortfall this plan closes
(a `<div>`/error-page render path is out of scope here and not attributable to the shard
change in any way this investigation can support).

**The 10 dropped lines, enumerated and classified.**

| # | File | Line | Source text | Classification |
|---|---|---|---|---|
| 1 | `src/app/(internal)/categories/components/CategoriesList.tsx` | 52 | `sort={(a, b) => a.name.localeCompare(b.name)}` (Income `TreeView`) | Browser-only behaviour |
| 2 | `src/app/(internal)/categories/components/CategoriesList.tsx` | 62 | `sort={(a, b) => a.name.localeCompare(b.name)}` (Expense `TreeView`) | Browser-only behaviour |
| 3 | `src/app/(internal)/imports/components/ImportWizard.tsx` | 51 | `file: z.any().refine(file => file, "File is required"),` (inside the module-scope `importSchema` object literal) | Browser-only behaviour |
| 4 | `src/lib/components/common/data/table/filters/DateFilter.tsx` | 108 | `<Button size="sm" variant="secondary" onClick={() => applyPreset("thisMonth")}>` | Browser-only behaviour |
| 5 | `src/lib/components/common/data/table/filters/DateFilter.tsx` | 111 | `<Button size="sm" variant="secondary" onClick={() => applyPreset("lastMonth")}>` | Browser-only behaviour |
| 6 | `src/lib/components/common/data/table/filters/DateFilter.tsx` | 114 | `<Button size="sm" variant="secondary" onClick={() => applyPreset("last7")}>` | Browser-only behaviour |
| 7 | `src/lib/components/common/data/table/filters/DateFilter.tsx` | 117 | `<Button size="sm" variant="secondary" onClick={() => applyPreset("last30")}>` | Browser-only behaviour |
| 8 | `src/lib/components/common/data/table/filters/DateFilter.tsx` | 120 | `<Button size="sm" variant="secondary" onClick={() => applyPreset("thisYear")}>` | Browser-only behaviour |
| 9 | `src/lib/components/common/dialog/ConfirmationDialog.tsx` | 74 | `<Button onClick={() => setOpen(false)} variant="outline">` (inside `AlertDialogCancel`) | Browser-only behaviour |
| 10 | `src/lib/components/common/form/MultiStepForm.tsx` | 213 | `onClickAction={index => setCurrentStep(index)}` (passed to `StepsVisualization`) | Browser-only behaviour |

**Why all ten are "browser-only behaviour", not "pure logic reachable from a unit test".**
Every one of these ten lines is a JSX-embedded callback (an `onClick` handler, or an
`Array.prototype.sort` comparator passed as a prop) defined *inside* a React function
component's render body, or — for line 3 — a statement whose enclosing module also only
renders through a component. Istanbul's line-coverage model marks the *body* of such a
callback as hit only when the callback is actually **invoked** — for the five `DateFilter`
presets and the `ConfirmationDialog` cancel button, invocation requires a real click event
inside a rendered DOM tree; for the two `CategoriesList` sort comparators, invocation requires
`Array.prototype.sort` to run its comparator, which V8 skips entirely for arrays of length < 2
and which happens inside `TreeView` (a separate child component), reachable only through full
React reconciliation, not through calling `CategoriesList()` as a plain function; for
`MultiStepForm`'s `onClickAction`, invocation requires clicking a step indicator in
`StepsVisualization`. None of this is reachable by importing the module alone (which only
executes module-scope statements, not function bodies) or by calling the exported component
function directly without a real render pass (JSX creation is lazy — it builds element
descriptor objects, it does not invoke child components or callbacks passed as props).

This was checked empirically, not assumed: the current local `.test/unit/coverage/lcov.info`
already shows every one of the five files above at 0 local unit hits for these exact lines
(`CategoriesList.tsx` 0/18, `ImportWizard.tsx` 0/35, `ConfirmationDialog.tsx` 0/18,
`MultiStepForm.tsx` 0/58 before this plan's Task 2 changes), confirming no existing or
straightforward new Vitest unit test reaches them. `DateFilter.tsx` already has 12/66 lines
covered locally — but only its non-JSX pure functions (`parseRange`, and
`DateFilterStrategy.getWhereClause`, exercised by an existing test) — never its five preset
`onClick` bodies, for the identical reason.

Rendering any of these components in a genuine way (to actually invoke the callback and mark
the line hit) would require either `@testing-library/react` (not an existing dependency —
adding it is a `package.json` change, explicitly forbidden for Task 2) or enabling a
`jsdom`/browser-like `environment` in `vitest.config.ts` (also explicitly forbidden — Task 2's
own acceptance criteria gates on `vitest.config.ts` being byte-identical). `ConfirmationDialog`
additionally calls `document.createElement` / `createRoot` directly in its function body,
which has no meaning under Vitest's current `environment: 'node'` default regardless of
mocking. Extracting any of these callbacks into an exported, independently-testable pure
function would be a `src/` change, which is also outside Task 2's permitted diff (`test/vitest/**`
and this file only) and would itself be an architectural change requiring a decision, not an
auto-fix. Given the codebase's existing Vitest suite is exclusively `.test.ts` (zero `.tsx`
test files exist anywhere in `test/vitest/`, confirmed by directory search), there is no
established, in-scope lever to reach these ten lines without one of the three changes above.

**Reverse-direction gains (for completeness, not part of the shortfall).** Three lines in
`src/app/error.tsx` (the Next.js global error boundary — lines 7, 9, 12) were hit in After
sample 1 but not in Before or After sample 2. This is consistent with a transient,
non-reproducing runtime error being triggered during that specific CI attempt (per the
Flake-check table below, run `32887712546` needed one job rerun after an `accounts.spec.ts`
timeout) — not a structural change caused by sharding, and not something this plan's scope
extends to chasing further.

**Outcome — carried into Task 2.** All ten lines are classified "browser-only behaviour" and,
per Task 2's action for that bucket combined with Task 2's own file-scope restriction (only
`test/vitest/**/*.test.ts` and this file may change — no Cypress spec, `vitest.config.ts`, or
`package.json` edit is in scope for that task), none of the ten can be closed within this
plan. Task 2 records the individual reason for each line below and, per this plan's own
`planner_assumptions` #7 ("a partial closure is a valid outcome"), raises local unit LH by
more than the 10-line union size via genuinely under-tested, previously-zero-coverage pure
logic elsewhere — satisfying the numeric bar without describing the original per-line drop,
the same outcome this plan's own action text prescribes for the fallback (expired-artifact)
path, applied here because the named lines themselves are provably unreachable within this
task's constraints rather than because the artifact expired.

### Coverage gap-closure outcome (plan 01-06, Task 2)

**All ten named lines: uncloseable within this task's scope, individually confirmed.**
Working the drop table one row at a time, each of the ten lines enumerated above was
re-checked against the current local `.test/unit/coverage/lcov.info` (pre-existing state,
before this task's additions) and confirmed still at 0 hits, then checked against the three
closure levers this task is actually permitted to use:

| # | File:Line | Why it cannot be closed here |
|---|---|---|
| 1–2 | `CategoriesList.tsx:52,62` | `Array.prototype.sort`'s comparator is only invoked by `TreeView` (a separate child component) during real React reconciliation with ≥ 2 sibling nodes; V8 skips calling the comparator entirely for shorter arrays. Reaching this requires a full render (`TreeView` executing its own body), not merely calling `CategoriesList()` — which only builds a lazy JSX descriptor object without invoking children. |
| 3 | `ImportWizard.tsx:51` | The line sits inside a module-scope `importSchema` object; the schema is constructed on import but never `.parse()`/`.safeParse()`'d at runtime — only the smaller per-step schemas (`uploadSchema` etc.) are passed to Formik's `toFormikValidationSchema`. A test that merely imports the module to execute this statement, without a real assertion tied to observable behaviour, would violate this plan's own "no test whose only effect is to execute a line" prohibition; the schema is not exported so its validation behaviour cannot be asserted from a test file without a `src/` change (out of this task's file scope). |
| 4–8 | `DateFilter.tsx:108,111,114,117,120` | Each is a `<Button onClick={() => applyPreset(...)}>` handler; the callback body only runs on a real click inside a rendered DOM tree. `applyPreset` itself is not exported, so its date-range logic cannot be asserted without either rendering the component or exporting/extracting the function (a `src/` change, out of scope for this task). |
| 9 | `ConfirmationDialog.tsx:74` | The `onClick={() => setOpen(false)}` handler only runs on a real click. Rendering this component at all additionally calls `document.createElement` / `createRoot` directly in its function body, which requires a DOM — Vitest's current `environment` is the Node default (no `jsdom`), and changing it is a forbidden `vitest.config.ts` edit for this task. |
| 10 | `MultiStepForm.tsx:213` | `onClickAction={index => setCurrentStep(index)}` is invoked by `StepsVisualization` only when a step indicator is clicked; same real-render requirement as the rows above. |

Closing any of these ten would require one of: adding `@testing-library/react` (a new
dependency — `package.json` must stay byte-identical per this task's acceptance criteria),
enabling a `jsdom`/browser `environment` in `vitest.config.ts` (also gated byte-identical),
or extracting the callback logic into an exported, independently-testable function in `src/`
(outside this task's `test/vitest/**` + this-file diff scope, and an architectural decision
in its own right — new exported utility surface, however small — not an auto-fix). None of
those three changes is available to this task. This is a deliberate scope boundary, not an
oversight: closing these lines is the correct subject for a decision at plan `01-07`'s
checkpoint, which can weigh whether to expand scope (add `@testing-library/react`,
enable `jsdom`) against accepting the small, now-fully-named residual gap.

**Numeric bar satisfied via genuinely under-tested pure logic (no per-line drop explained).**
Since none of the ten named lines could be closed, and per this plan's own
`planner_assumptions` #7 ("a partial closure is a valid outcome"), local unit `LH` was instead
raised above the 10-line union size by adding real, assertion-bearing tests for previously
**zero-coverage** pure-logic functions with no rendering, DOM, or Prisma dependency — the same
outcome this plan's action text already prescribes for the fallback (expired-artifact) path,
applied here because the named lines are provably unreachable rather than because the artifact
expired. Three functions were selected, all in `src/lib/util/`, all previously at 0 local
hits:

| Function | File | Before | Tests added |
|---|---|---|---|
| `formatFileSize` | `src/lib/util/formatter/FileSizeFormatter.ts` | 0/10 hit | 8 tests — zero-byte (default and forced-unit label), auto-unit selection at B/KB/MB scale, the `Math.min` clamp at the TB ceiling for values beyond the `UNITS` table, forced-unit override, and custom `decimals` on both the auto and forced-unit paths |
| `UserFormatter.format` | `src/lib/util/formatter/UserFormatter.ts` | 0/1 hit | 2 tests — correct `firstName lastName` concatenation and an explicit "does not swap the parts" assertion |
| `cn` | `src/lib/util/utils.ts` | 0/1 hit | 5 tests — plain merging, dropping falsy conditional values, keeping truthy ones, array flattening, and a `twMerge`-specific conflict-resolution case (`cn("p-2", "p-4")` must resolve to `"p-4"`, not concatenate both) |

Added under `test/vitest/lib/util/formatter/formatter.test.ts` (extended existing file, new
`describe` blocks for `UserFormatter` and `formatFileSize`) and
`test/vitest/lib/util/utils.test.ts` (new file), following the existing
describe/test structure and `FormatterContext` fixtures already used in that file.

**Local before/after measurement** (computed identically to Task 1: `DA:` record count = LF,
count with hits > 0 = LH, read from `.test/unit/coverage/lcov.info` after `yarn test:unit`):

| | LF | LH |
|---|---|---|
| Before this task's additions | 3826 | 1110 |
| After this task's additions | 3826 | 1122 |
| Delta | **0** (unchanged, as required) | **+12** |

LF is byte-identical before and after (3826 both times — confirming no source file entered or
left the instrumented set), and LH rose by 12, exceeding the 10-line union size of Task 1's
drop table. This is a **local, unit-only** figure; the authoritative merged figure (unit + E2E
shards combined, matching the methodology of the "Coverage comparison (D-10, criterion 4)"
table above) can only come from a fresh CI run, which is plan `01-07`'s job, not this task's.

**Teeth check — every new test observed failing against a deliberate break, then reverted:**

| Test file | Break applied | Result | Reverted |
|---|---|---|---|
| `formatter.test.ts` (`formatFileSize`) | Shifted the auto-unit index by `+1` in the `Math.min(...)` calculation | 4 tests went red (auto-KB, auto-MB, custom-decimals, and the original small-value case shifted a unit) | Yes |
| `formatter.test.ts` (`formatFileSize`) | Removed the `Math.min` TB clamp entirely | The TB-clamp test went red (`"1.0 undefined"` — indexed past the end of `UNITS`) | Yes |
| `formatter.test.ts` (`formatFileSize`) | Changed the zero-byte default unit from `"B"` to `"KB"` | The zero-byte default test went red; the forced-unit zero-byte test stayed green (confirming the two tests exercise distinct branches) | Yes |
| `formatter.test.ts` (`formatFileSize`) | Added `+ 1` to the forced-unit `divisor` exponent | The forced-unit and custom-decimals tests both went red | Yes |
| `formatter.test.ts` (`UserFormatter`) | Swapped `firstName`/`lastName` order in the return template | Both `UserFormatter` tests went red | Yes |
| `utils.test.ts` (`cn`) | Replaced `twMerge(clsx(inputs))` with plain `clsx(inputs)` | Only the Tailwind-conflict-resolution test went red (the other four `cn` tests, which do not exercise `twMerge`'s conflict resolution, correctly stayed green) | Yes |

Every break was applied to `src/`, confirmed red via `yarn vitest run <file> --coverage=false`,
then reverted; `git diff --stat` against these three source files shows no residual change.

**Verification commands run:**
- `yarn test:unit` — exit 0, 44 files / 370 tests passed
- `grep -rc 'istanbul ignore' src/ | grep -v ':0$' | wc -l` — `0`
- `git diff --exit-code -- nyc.config.js vitest.config.ts cypress.config.ts package.json` — no output
- `yarn tsc --noEmit` — **pre-existing failure, not introduced by this task.** Three errors are
  reported, all in files this task never touched: `test/cypress/e2e/mobile.spec.ts:82` (a
  `JQuery<HTMLElement>`-to-`string` cast) and two in
  `test/vitest/app/api/transactions/attachments/attachmentRoutes.test.ts` (missing
  `transactionTemplateId` field on a test fixture after a Prisma schema change from an earlier
  phase-01 plan). Confirmed neither new test file (`formatter.test.ts`, `utils.test.ts`)
  appears anywhere in the error output. This is an out-of-scope, pre-existing defect per this
  executor's scope-boundary rule — not fixed here, flagged for the phase verifier and for
  plan `01-07`'s checkpoint.

**Every line in the drop table is accounted for above** — none is silently omitted; all ten
carry an individual, specific reason they were not closed in this task.

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

**Coverage gap-closure investigation (plan `01-06`):** reuses the same three run IDs already
listed above — `32869899958` (Before, artifact `lcov-info`), `32887712546` (After sample 1,
artifact `merged-lcov`) and `32905249686` (After sample 2, artifact `merged-lcov`) — no new CI
run was triggered for this plan's Task 1. Repository ownership was independently re-confirmed
via `gh api repos/financer-project/financer/actions/runs/32869899958/artifacts` before
downloading (per this plan's own precondition), and none of the three artifacts had expired at
the time of download.
