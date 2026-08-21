# Phase 1: Bug Fixes & E2E Baseline - Research

**Researched:** 2026-08-21
**Domain:** React/Next.js filter+form UI bugs (Blitz.js/Radix UI/Formik stack) + Cypress E2E CI parallelization
**Confidence:** MEDIUM-HIGH (BUG-02 root cause is HIGH — verified via direct source reads of three layers; BUG-01 is LOW/unresolved — no reproducible defect found via static analysis, dynamic reproduction blocked by sandbox limitations; TEST-01 is HIGH — corroborated by this project's own prior STACK.md research plus independent verification today)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Counterparty filter fix (#78)**
- **D-01:** No known repro steps exist — research/implementation must reproduce the crash by exercising counterparty filter interactions (single select, multi-select, clearing the filter) against the current code.
- **D-02:** `SelectFilter.tsx` treats the string `"null"` as a magic token mapped to a real Prisma `null` (used today by Category's "Uncategorized" option). The Counterparty filter's option list in `TransactionsList.tsx` has no such entry. This is a plausible lead worth checking, but must be confirmed via actual reproduction before being treated as the root cause — don't assume it without verifying.
- **D-03:** Fix scope is correctness, not just "doesn't crash" — every counterparty must be selectable, clearing must work, and results must match the selection.

**Tab navigation order (#76)**
- **D-04:** Correct Tab order = standard DOM/visual order, top-to-bottom left-to-right, matching `TransactionForm.tsx`'s visual layout. No custom `tabIndex` scheme — just fix whatever currently breaks the native flow.
- **D-05:** No specific field named as broken — research must identify the trap/skip by testing the whole form, including the day-picker (react-day-picker) date field and the Radix-based `SelectField`/multi-select fields.
- **D-06:** Shift+Tab must retrace the **exact reverse** of the forward Tab path (not just "functional, no traps").

**E2E parallelization approach (#71)**
- **D-07:** Claude's discretion on matrix-vs-in-job-sharding (see Claude's Discretion below).
- **D-08:** Per-worker DB isolation: **one Testcontainers MySQL instance per parallel worker.** Today `TestUtilityDBContainer.ts` is a single shared instance — reversible, test-infra internal, not a published contract.
- **D-09:** No fixed shard count or time target. Determine empirically: pick a shard count that meaningfully cuts CI wall-clock time without excessive runner overhead (diminishing returns expected past ~4-6 shards for 14 spec files), and record the actual measured improvement.

**Baseline capture method**
- **D-10:** Baseline must be a **committed artifact** in the phase directory (e.g. a `BASELINE.md`-style doc) — not just a PR/commit description note.
- **D-11:** Baseline numbers (CI wall-clock time, LCOV coverage) must come from an **actual CI run** (push a baseline commit, read GitHub Actions' reported duration/coverage), not a local timing measurement.

### Claude's Discretion
- **Parallelization mechanism (D-07):** Deferred to research/planning judgment between a GitHub Actions build matrix (multiple runners, full isolation, no paid Cypress Cloud needed) and single-job in-process sharding (e.g. `cypress-split`, fewer runner-minutes but more CPU contention and less isolation per machine). Decide based on GitHub Actions runner limits, Testcontainers startup cost per worker, and the project's current CI plan (no evidence of a paid Cypress Cloud subscription today).

  **Research finding on this discretion point:** the framing of `cypress-split` as an *alternative* to a GitHub Actions matrix is not quite accurate — `cypress-split` is a spec-distribution mechanism designed to be used **together with** a GitHub Actions matrix (it reads `SPLIT`/`SPLIT_INDEX` env vars, typically sourced from `strategy.job-total`/`strategy.job-index`, to decide which spec subset the *current matrix job* runs). It does not run multiple Cypress workers in one process/one job. Recommendation: **use a GitHub Actions build matrix with `cypress-split` for spec distribution** — this satisfies D-08 automatically (each matrix job is a fully separate GitHub-hosted VM with its own Docker daemon, so each gets its own Testcontainers MySQL/Redis instance with zero code changes to `TestUtilityDBContainer.ts`'s hardcoded ports). See Architecture Patterns below.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BUG-01 | Counterparty filter on the Transaction List works without throwing an error (#78) | Full filter pipeline traced and documented (Architecture Patterns, Common Pitfalls). No defect found via static analysis that distinguishes Counterparty from the working Category filter — plan must budget an explicit reproduction/diagnosis task before a fix task. See Open Questions and Environment Availability. |
| BUG-02 | Tab-key navigation correctly moves focus through date and select fields in forms (#76) | Root cause identified with HIGH confidence via direct source reads: `SelectField.tsx`'s Radix `PopoverTrigger asChild` clones onto a plain `<div>` (`InputGroup`) with no `tabIndex`, removing it from the native Tab order. Concrete fix location, verified test-tooling recommendation (`cypress-real-events`), and DatePicker analysis (likely NOT broken) provided below. |
| TEST-01 | Cypress E2E suite runs faster via sharded/parallel execution, with coverage no worse than the current baseline (#71) | GitHub Actions matrix + `cypress-split` architecture fully specified, corroborated by this project's own prior `.planning/research/STACK.md`. Coverage-merge mechanism (existing `lcov-result-merger`) verified already installed — no new dependency needed for that part. Pitfall 8 (`.planning/research/PITFALLS.md`) directly governs this requirement's guardrails. |
</phase_requirements>

## Summary

This phase bundles three unrelated fixes against the same codebase area (the transaction list/form UI and the Cypress E2E harness), with no new product capabilities. Static analysis this session fully traced all three:

**BUG-02 (Tab navigation)** has a concrete, verified root cause: `SelectField.tsx` (used by every `SelectFormField` instance in `TransactionForm.tsx` — Account, Type, Category, Counterparty, Tags) wraps its clickable surface in Radix's `<PopoverTrigger asChild>`, cloning Radix's trigger behavior onto `InputGroup`, which renders a plain `<div role="group">` with **no `tabIndex`**. Verified by reading `@radix-ui/react-primitive`'s `asChild` handling and `@radix-ui/react-popover`'s `PopoverTrigger` implementation directly from `node_modules`: neither injects a default `tabIndex`, so a `<div>` child is not part of the native Tab order. `DatePicker.tsx`, by contrast, clones onto a `<div>` that *contains* a real `<Button>` (native, focusable by default) — the date field is more likely to already be in the Tab order correctly, though this needs on-browser confirmation. **The fix is a single change to `SelectField.tsx`** (add `tabIndex`/keyboard-activation to the trigger element), which resolves all five affected fields at once — matching D-05's "test the whole form" framing (it's one systemic component bug, not five separate ones).

**BUG-01 (Counterparty filter crash)** could NOT be root-caused via static analysis. The entire filter pipeline (`SelectFilter.tsx` → `prisma-filter-builder.ts` → `registry.ts` → `TransactionsList.tsx`'s filter config → `useDataTable.ts` → `getTransactions.ts` resolver → Prisma schema) was traced end-to-end and found structurally identical between the working Category filter and the broken Counterparty filter, with one difference: Category has a `"null"` sentinel option (D-02's lead) that Counterparty's option list does not expose — meaning a user cannot reach the `"null"`-token code path through the Counterparty filter's UI at all, which weighs *against* D-02's hypothesis rather than for it. Dynamic reproduction (running the dev server against a real MySQL/Redis Testcontainers instance) was attempted but is **not possible in this research environment** — the local Docker daemon is not running (see Environment Availability). **The plan must include an explicit, first-class reproduction/diagnosis task** (get the actual error message/stack trace via Cypress or manual browser testing) before a fix task, per D-01's own framing.

**TEST-01 (E2E speed-up)** has a well-supported architecture: a GitHub Actions build matrix (e.g. 4 shard jobs) combined with `cypress-split` for spec distribution — no Cypress Cloud required, and each matrix job's independent VM automatically gives each shard its own Docker daemon, satisfying D-08's per-worker DB isolation with **zero changes needed** to `TestUtilityDBContainer.ts`'s currently-hardcoded ports (3307/6380), since matrix jobs never share a network namespace. This finding is corroborated by this project's own `.planning/research/STACK.md` (already recommends `cypress-split@1.25.0` + GH Actions matrix, independently re-verified this session against the npm registry). Coverage merging across shards needs no new dependency — `lcov-result-merger` is already a project devDependency and already wired into `yarn coverage:merge`; it just needs to run after an `actions/download-artifact` step that collects each shard's coverage output. `.planning/research/PITFALLS.md` Pitfall 8 (already researched for this milestone) is the load-bearing guardrail: do not cut `retries.runMode: 2` or `after()` cleanup to gain speed; prefer disabling video recording (`video: false`, not currently set, defaults to `true`) and moving unit-testable logic to Vitest.

**Primary recommendation:** Fix BUG-02 first (single, well-understood code change in `SelectField.tsx`) and use it to build the Cypress Tab-order regression test with `cypress-real-events`. Budget a dedicated reproduction/diagnosis task for BUG-01 before attempting a fix — do not implement D-02's `"null"`-token theory speculatively. For TEST-01, implement the GitHub Actions matrix + `cypress-split` architecture, keep `retries.runMode: 2`, and treat the LCOV-diff + 3x-repeat-run checks as hard merge gates, not optional polish.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Counterparty filter UI + value change (BUG-01) | Browser / Client | — | `SelectFilter.tsx`/`TableToolbar.tsx` are `"use client"` components managing URL search params; no server code involved until the query fires |
| Counterparty filter → Prisma `where` clause (BUG-01) | Browser / Client (builder) → API / Backend (execution) | Database | `buildPrismaWhere` runs client-side to produce a plain object; `getTransactions.ts` (API/Backend tier) executes it against Prisma/MySQL |
| Tab/focus order in `TransactionForm.tsx` fields (BUG-02) | Browser / Client | — | Pure DOM/keyboard-focus behavior; no server involvement. Root cause lives entirely in `SelectField.tsx`'s Radix composition |
| Cypress E2E parallelization/sharding (TEST-01) | CI / Test Infra (not a runtime app tier) | Database (Testcontainers MySQL/Redis per worker) | `.github/workflows/ci.yml` orchestrates matrix jobs; `TestUtilityDBContainer.ts` remains the per-job database bootstrap, unchanged in code |
| Coverage merge across shards (TEST-01) | CI / Test Infra | — | `lcov-result-merger` (already installed) run in a downstream CI job after `actions/download-artifact` |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `cypress-split` | 1.25.0 `[ASSUMED — name discovered via WebSearch, not Context7/official docs; registry+legitimacy check both return OK, see Package Legitimacy Audit]` | Splits the 14 E2E spec files across GitHub Actions matrix jobs by count/weight, no Cypress Cloud | Reads `SPLIT`/`SPLIT_INDEX` env vars to select which specs the current matrix job runs; free, self-contained, purpose-built for exactly this scenario. Corroborated independently by this project's own `.planning/research/STACK.md` (same version, same rationale) |
| `cypress-real-events` | 1.15.0 `[ASSUMED — name discovered via WebSearch; registry+legitimacy check both return OK, see Package Legitimacy Audit]` | `cy.realPress('Tab')` — fires genuine native browser key events via Chrome DevTools Protocol, for a real regression test of BUG-02 | Needed because Cypress's built-in synthetic events and the alternative `cypress-plugin-tab` package do not exercise the *actual* browser Tab-focus algorithm (`cypress-plugin-tab` has documented issues around `tabindex="-1"` and keydown-triggered focus changes) — a fix for "the div isn't in the native tab order" can only be regression-tested with a tool that drives the real browser tab order, not a JS simulation of it |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `lcov-result-merger` | 5.0.1 (already installed) | Merge per-shard `.info` coverage files into one `.test/lcov.info` | Already wired via `yarn coverage:merge`; extend the CI workflow's merge step to run after all E2E shard artifacts are downloaded, no version change needed |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `cypress-split` + GH Actions matrix | `cypress-io/github-action`'s built-in `parallel: true` | Requires a paid Cypress Cloud subscription + `CYPRESS_RECORD_KEY`; project has neither configured — ruled out per D-07's own framing ("no evidence of a paid Cypress Cloud subscription today") |
| `cypress-split` + GH Actions matrix | Manual `--spec` glob splitting (zero new dependency, e.g. a small script bucketing `test/cypress/e2e/*.spec.ts` alphabetically) | Avoids one devDependency, but loses `cypress-split`'s duration-weighted balancing (later versions can balance shards by historical spec run time, not just file count) and is more code to hand-roll/maintain for equivalent value |
| `cypress-real-events` for Tab testing | `cypress-plugin-tab` (`cy.tab()`) | Simpler API, but documented reliability issues (mishandles `tabindex="-1"`, gets the wrong element when a `keydown` handler changes focus) make it a poor fit for a regression test whose entire point is verifying real native tab-order correctness |

**Installation:**
```bash
yarn add -D cypress-split@1.25.0 cypress-real-events@1.15.0
```

**Version verification:** Both versions confirmed via `npm view <pkg> version` against the live npm registry on 2026-08-21 (see Package Legitimacy Audit). `cypress-real-events` peer dependency range (`cypress: "^4.x || ... || ^15.x"`) confirmed compatible with the project's installed `cypress@15.10.0`.

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|--------------|---------|-------------|
| `cypress-split` | npm | published 2026-06-15 (current major, actively released) | 436,295/week | github.com/bahmutov/cypress-split | OK | Approved — planner must still gate the `yarn add` behind a `checkpoint:human-verify` task per the WebSearch-discovery provenance rule below |
| `cypress-real-events` | npm | published 2025-09-05 | 1,089,486/week | github.com/dmtrKovalenko/cypress-real-events | OK | Approved — planner must still gate the `yarn add` behind a `checkpoint:human-verify` task per the WebSearch-discovery provenance rule below |

**Packages removed due to [SLOP] verdict:** none.
**Packages flagged as suspicious [SUS]:** none.

Both packages were discovered via WebSearch (not Context7 or an official docs page fetched directly), so per the package-name provenance rule they are tagged `[ASSUMED]` in the Standard Stack table above **despite** returning `OK` from both `npm view` and the `package-legitimacy check` seam, no `postinstall` script, high weekly download counts, and a real GitHub source repo each. This project's own prior `.planning/research/STACK.md` independently arrived at the identical `cypress-split@1.25.0` recommendation, which is a strong corroborating signal but was itself sourced via web search, so it does not upgrade the provenance tier. **Planner: add a `checkpoint:human-verify` task before either `yarn add -D` step.**

## Architecture Patterns

### System Architecture Diagram — Counterparty filter data flow (BUG-01)

```
Browser (TransactionsList.tsx)
  │
  │ user selects/clears counterparty in SelectFilter (multi-select)
  ▼
SelectFilterComponent.onChange(csv-string | null)
  │
  ▼
TableToolbar.updateQuery(key="counterpartyId", value)
  │  (router.push with new URLSearchParams)
  ▼
Next.js client navigation → re-render
  │
  ▼
useDataTable() → buildPrismaWhere({ searchParams, filters, search })
  │  filters.find(f => f.property === "counterpartyId")
  │  → SelectFilterStrategy.getWhereClause(config, "id1,id2")
  │     - split "," → filter empty → map "null"→null (UNREACHABLE for Counterparty:
  │       no "null" option exists in TransactionsList.tsx's Counterparty filter config)
  │     - multiSelect branch → { counterpartyId: { in: [id1, id2] } }
  ▼
usePaginatedQuery(getTransactions, { where, householdId, skip, take })
  │  (Blitz RPC call to server)
  ▼
getTransactions.ts resolver
  │  resolver.zod(GetTransactionsSchema)  — where: z.custom<TransactionWhereInput>() (pass-through, no defect found)
  │  resolver.authorize()
  │  where = { ...where, account: { householdId } }
  ▼
db.transaction.findMany({ where, include: { category, counterparty, account, tags, attachments, createdBy } })
  ▼
Prisma → MySQL
```

No structural defect was found anywhere on this path via static analysis. **This diagram is the artifact the executor should use to instrument/log at each arrow during reproduction**, since the actual failure point is unknown.

### System Architecture Diagram — Tab focus composition (BUG-02, root cause)

```
TransactionForm.tsx
  │  renders 5x SelectFormField (Account, Type, Category, Counterparty, Tags)
  ▼
SelectFormField.tsx → SelectField.tsx
  │
  ▼
<Popover modal={false}>
  <PopoverTrigger asChild>          ← Radix: clones trigger props onto ITS CHILD
    <InputGroup role="select-field" onClick={...}>   ← renders a plain <div role="group">
      ...                                              (input-group.tsx: NO tabIndex set)
    </InputGroup>
  </PopoverTrigger>
  <PopoverContent>...</PopoverContent>
</Popover>
```

Verified via direct reads:
- `node_modules/@radix-ui/react-popover/dist/index.js:129-148` — `PopoverTrigger` renders `Primitive.button` with `type`, ARIA attrs, `onClick`; no `tabIndex` in `triggerProps` merge.
- `node_modules/@radix-ui/react-primitive/dist/index.js:64-67` — `asChild` present → `Comp = Slot`, so `Primitive.button` becomes `Slot`, which clones props onto the child (`InputGroup`'s div) instead of rendering a native `<button>`.
- `node_modules/@radix-ui/react-primitive/node_modules/@radix-ui/react-slot/dist/index.js:101-121` (`mergeProps`) — only merges event handlers, `style`, `className`, and pass-through props; never injects `tabIndex`.
- `src/lib/components/ui/input-group.tsx:11-17` — `InputGroup` is a `<div role="group" ...>` with no `tabIndex` attribute anywhere in its props or spread.

Net effect: the DOM node a user clicks to open a Select field is a `<div>` with `onClick`, ARIA attributes, and `role="select-field"` — but **no `tabIndex`**, so it is skipped entirely by native Tab/Shift+Tab traversal. Compare `DatePicker.tsx:48-64`: also `<PopoverTrigger asChild><div className="relative w-full"><Button ...>`, but the *actual* interactive element inside that div is a real `<Button>` (native `<button>`, focusable by default regardless of the wrapping div's own focusability) — this is architecturally different and less likely to exhibit the same defect, though it should still be confirmed on-browser per D-05 ("test the whole form").

No custom `tabIndex` scheme exists anywhere else in the form layer (`grep tabIndex src/` returns only one unrelated hit in `src/lib/components/ui/sidebar.tsx`), confirming D-04's framing: this is a "restore native flow" fix, not a scheme-conflict fix.

### System Architecture Diagram — CI matrix + spec sharding (TEST-01)

```
push / pull_request
  │
  ▼
job: build-and-lint  (unchanged: checkout, install, build, lint)
  │
  ├──▶ job: unit-tests        (yarn test:unit, uploads unit coverage artifact)
  ├──▶ job: component-tests   (cypress --component, uploads component coverage artifact)
  └──▶ job: e2e-tests  [strategy.matrix.shard: [1,2,3,4]]
          │  each matrix job = separate GH-hosted VM, own Docker daemon
          │  env: SPLIT=${{ strategy.job-total }}  SPLIT_INDEX=${{ strategy.job-index }}
          │
          ├─ TestUtilityDBContainer.startDatabase()   ← own MySQL:3307 + Redis:6380
          │   (no code change needed — separate VM ⇒ no port collision across shards)
          ├─ cypress run --e2e  (cypress-split selects this shard's spec subset)
          └─ upload-artifact: e2e-coverage-shard-${{ matrix.shard }}
                    │
                    ▼
job: merge-coverage-and-sonar  (needs: [unit-tests, component-tests, e2e-tests])
  │  download-artifact (pattern: *-coverage-*)
  │  yarn coverage:merge   (lcov-result-merger, already installed)
  ▼
SonarQube scan (runs ONCE, on the fully merged lcov.info — not per-shard)
```

Key implementation notes:
- Each matrix job is a fully separate runner VM — `TestUtilityDBContainer.ts`'s hardcoded host ports (`3307` MySQL, `6380` Redis) do **not** need to become dynamic/per-worker; they only collide if multiple Cypress processes share one VM (which this architecture avoids by construction). This directly satisfies D-08 with no source change to the container class itself.
- `retries.runMode: 2` (already set in `cypress.config.ts`) and `after()` cleanup must remain untouched (Pitfall 8) — do not treat them as speed levers.
- SonarQube must run exactly once, after coverage merge, not once per shard (avoid duplicate/partial submissions to the SonarQube project).
- Recommended additional speed lever (no code risk, corroborated by `.planning/research/STACK.md`): set `video: false` for the `e2e` config block in `cypress.config.ts` (currently unset, defaults to `true` — video encoding is a large fixed per-spec cost); screenshots-on-failure already cover the debugging need.

### Recommended Project Structure

No new files/directories required for BUG-01/BUG-02 (fixes land in existing files). For TEST-01:
```
.github/workflows/
└── ci.yml                    # split into build/lint, unit, component, e2e(matrix), merge-coverage+sonar jobs
.planning/phases/01-bug-fixes-e2e-baseline/
└── BASELINE.md                # D-10: committed artifact with pre/post CI wall-clock + coverage numbers (from actual CI runs, per D-11)
```

### Anti-Patterns to Avoid
- **Implementing D-02's `"null"`-token fix speculatively without reproducing first:** static analysis shows the Counterparty filter's option list has no `"null"` entry, so a user cannot reach that code path through the UI — "fixing" it without first confirming the actual error risks leaving the real bug in place while adding unused code.
- **Cutting `retries.runMode` or `after()` cleanup to hit a wall-clock target (Pitfall 8):** these exist to keep specs deterministic/independent; cutting them trades a real perf win for CI flake and cross-spec data contamination.
- **Running SonarQube per-shard:** submits partial/duplicate coverage; must run once after merge.
- **Making `TestUtilityDBContainer.ts`'s ports dynamic "just in case":** unnecessary code churn given the matrix architecture already provides VM-level isolation — only revisit if the plan later chooses in-job sharding instead of a GH Actions matrix.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|--------------|-----|
| Distributing 14 spec files evenly/by-weight across N CI machines | A custom Node script that globs `test/cypress/e2e/*.spec.ts` and buckets them | `cypress-split` | Already handles count-based and duration-weighted balancing, env-var driven, zero server dependency; hand-rolling loses the weighting refinement for no real benefit |
| Simulating real browser Tab-key focus movement in a test | Manual `cy.get(...).trigger('keydown', { key: 'Tab' })` chains | `cypress-real-events`'s `cy.realPress('Tab')` | Synthetic keydown events don't drive the browser's actual focus algorithm — the exact thing this bug is about; a test using synthetic events could pass even though the real user experience is still broken |
| Merging LCOV reports from parallel jobs | A custom script parsing `.info` files | `lcov-result-merger` (already installed, already used by `yarn coverage:merge`) | No new tooling needed — just needs to run after artifacts are collected from the new matrix jobs |

**Key insight:** All three TEST-01 building blocks (spec splitting, coverage merging, and — if needed — Tab simulation for the BUG-02 regression test) already have purpose-built, actively-maintained tools; this phase is glue/configuration work, not new tooling.

## Common Pitfalls

### Pitfall 1 (BUG-01): Treating D-02's "null"-token theory as confirmed without reproduction
**What goes wrong:** The team implements a fix for the `"null"` sentinel mismatch, ships it, and the crash persists (or was never actually related), because the option list for Counterparty never exposes a `"null"` value in the first place — that code path is unreachable via the current UI.
**Why it happens:** D-02 explicitly flags this as "a plausible lead," and it's the most visible difference between the Category and Counterparty filter configs, making it an attractive first guess.
**How to avoid:** Reproduce the actual error first (browser console / Cypress `cy.on('uncaught:exception')` / server logs) and confirm the stack trace touches the `"null"` code path before attempting that specific fix. If it doesn't reproduce through single-select, multi-select, or clearing under normal circumstances, broaden the investigation (see Open Questions).
**Warning signs:** A "fix" changes `SelectFilterStrategy`/`TransactionsList.tsx` but no one has seen the actual error message/stack trace it's supposed to resolve.

### Pitfall 2 (BUG-02): Fixing only visual/click behavior, not the actual native Tab order
**What goes wrong:** A fix adds `tabIndex={0}` to `InputGroup` globally (affecting every other `InputGroup` usage in the app, e.g. search inputs, not just `SelectField`), or adds it without keyboard-activation handling (`onKeyDown` for Enter/Space to open the popover) — the field becomes Tab-reachable but not operable via keyboard once focused, still failing accessibility/UX expectations even though the specific "Tab lands on every field" success criterion might technically pass.
**Why it happens:** `InputGroup` is shared by multiple consumers (`SelectField`, plain search inputs in `TableToolbar.tsx`); a fix scoped too broadly or too narrowly can either break unrelated UI or leave the field focusable-but-inert.
**How to avoid:** Scope the `tabIndex`/keyboard fix to the specific `InputGroup` instance rendered inside `SelectField.tsx`'s `PopoverTrigner`-wrapped trigger (e.g. via a prop passed from `SelectField`, not a change to `InputGroup`'s own default rendering), and add an `onKeyDown` handler for `Enter`/`Space`/`ArrowDown` to open the popover, matching standard combobox keyboard semantics. Verify with `cy.realPress('Tab')` followed by `cy.realPress('Enter')` that the field both receives focus AND opens.
**Warning signs:** Manual Tab-through reaches the field but pressing Enter/Space does nothing.

### Pitfall 3 (TEST-01, from `.planning/research/PITFALLS.md` Pitfall 8): Cypress speed-ups quietly reduce coverage or reliability
**What goes wrong:** Lowering `retries.runMode` from 2, dropping `after()` cleanup, or sharing one Testcontainers instance across parallel workers to save setup time each look like easy wins but reintroduce flake or cross-spec data contamination.
**Why it happens:** These mechanisms look like "incidental overhead" when profiling for speed, but they exist specifically to keep specs deterministic and independent.
**How to avoid:** Keep `retries.runMode: 2` and all `after()` cleanup as non-negotiable. Get isolation from the GH Actions matrix architecture (one VM per shard) rather than any in-process sharing. Move genuinely unit-testable logic to Vitest before touching Cypress config. Treat the LCOV-diff check and a 3x-repeated CI run (per D-11 / this phase's own success criterion 4) as hard merge gates.
**Warning signs:** Flaky failures appear only in CI, only when run alongside other specs; `.test/lcov.info` coverage percentage drops after the "performance" change with no corresponding feature removal.

## Code Examples

### Verified pattern — where the BUG-02 fix must land (`SelectField.tsx`, current broken code)
```typescript
// Source: src/lib/components/common/form/elements/SelectField.tsx (read this session, lines 202-231)
<Popover open={isOpen} onOpenChange={setIsOpen} modal={false}>
    <PopoverTrigger asChild>
        <InputGroup
            role="select-field"
            className={cn(
                "cursor-pointer shadow-sm text-sm",
                readonly && "opacity-50 pointer-events-none",
                props.className
            )}
            onClick={(event) => {
                event.preventDefault()
                if (!readonly) setIsOpen(true)
            }}>
            {/* ... */}
        </InputGroup>
    </PopoverTrigger>
    {/* ... */}
</Popover>
```
`InputGroup` (`src/lib/components/ui/input-group.tsx:11-17`) renders `<div role="group" {...props} />` — no `tabIndex` in its own JSX or default props, and Radix's `asChild`/`Slot` merge (verified in `node_modules/@radix-ui/react-primitive` + `.../react-slot`) does not inject one either. The planner's fix task should add a `tabIndex` (and matching `onKeyDown` for Enter/Space activation) to this specific `InputGroup` instance — not to the shared `InputGroup` component's defaults, since it's also used for plain (already-focusable, `<input>`-containing) search fields elsewhere.

### Verified pattern — GitHub Actions matrix + cypress-split (from web research, cross-checked against 2+ independent sources)
```yaml
# Illustrative shape only — planner must adapt exact syntax during implementation
jobs:
  e2e-tests:
    strategy:
      fail-fast: false
      matrix:
        containers: [1, 2, 3, 4]
    runs-on: ubuntu-latest
    steps:
      # ... checkout, install, build (or reuse a build artifact) ...
      - name: Run E2E shard
        uses: cypress-io/github-action@v6
        with:
          start: yarn test:start:app
          wait-on: http://localhost:3000/api/health-check
          browser: chrome
        env:
          NODE_ENV: test
          DATABASE_URL: mysql://financer-test:password@localhost:3307/financer-test
          SESSION_SECRET_KEY: test-session-secret-which-is-32-bytes-long
          SPLIT: ${{ strategy.job-total }}
          SPLIT_INDEX: ${{ strategy.job-index }}
      - uses: actions/upload-artifact@v5
        with:
          name: e2e-coverage-shard-${{ matrix.containers }}
          path: .test/e2e/coverage
```

### Existing test pattern to mirror for BUG-01's E2E regression test
```typescript
// Source: test/cypress/e2e/transactions.spec.ts (read this session, lines 75-92) —
// existing "Category" filter test; BUG-01's fix should get a directly analogous
// "Counterparty" test added to the same describe block once the bug is understood.
it("should filter transactions by category (multi-select) and reset", () => {
    cy.get("tbody tr").should("have.length", 2)
    cy.selectField({ contains: "Category", value: "Income" })
    cy.url().should("include", "categoryId=")
    cy.get("tbody tr").should("have.length", 1)
    cy.selectField({ contains: "Category", value: "Cost of Living" })
    cy.get("tbody tr").should("have.length", 2)
    cy.contains("button", "Reset").click()
    cy.get("tbody tr").should("have.length", 2)
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Cypress Dashboard/Cloud-based `parallel: true` for CI parallelization | GitHub Actions build matrix + free spec-splitting plugin (`cypress-split`) | N/A — project has never used Cypress Cloud (no `CYPRESS_RECORD_KEY` in `ci.yml`) | Avoids recurring Cypress Cloud cost while achieving the same wall-clock benefit for this repo's scale (14 specs) |
| `cypress-plugin-tab`'s JS-simulated `cy.tab()` | CDP-based `cypress-real-events`'s `cy.realPress('Tab')` | Community consensus has shifted toward CDP-based real-event tools as Cypress's own event model matured; `cypress-plugin-tab`'s open issues (mishandled `tabindex="-1"`, keydown-triggered focus changes) remain unresolved | Only a CDP-based tool reliably tests *actual* native tab order, which is exactly what BUG-02's regression test needs to assert |

**Deprecated/outdated:** None specific to this phase; the codebase's existing patterns (Testcontainers per test run, `retries.runMode: 2`, single-job sequential CI) are all still current best-practice for a project this size — the phase is additive (matrix + spec-split), not a framework migration (Playwright migration was explicitly rejected in `.planning/research/STACK.md`, and this research does not revisit that).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|----------------|
| A1 | `cypress-split@1.25.0` is the correct package name/version for spec distribution | Standard Stack, Architecture Patterns | Low — corroborated independently by this project's own prior `.planning/research/STACK.md` research plus a fresh `npm view`/legitimacy check this session; still tagged `[ASSUMED]` per the strict WebSearch-discovery provenance rule |
| A2 | `cypress-real-events@1.15.0` is the correct package for native Tab-key simulation | Standard Stack | Low-Medium — verified OK via registry + legitimacy check + peer-dep compatibility with installed Cypress 15.10.0, but package selection itself came from WebSearch, not Context7/official docs |
| A3 | `DatePicker.tsx`'s date field is likely NOT affected by the same tabIndex defect as the select fields (it wraps a real `<Button>`, not a bare div) | Architecture Patterns, Summary | Medium — this is a reasoned inference from source reads, not an on-browser confirmation; D-05 explicitly requires testing the whole form including the date field, so this must still be verified in-browser/Cypress before being treated as "not broken" |
| A4 | No structural defect exists in the Counterparty filter's code path that isn't equally present in the (working) Category filter's code path | Summary, Common Pitfalls | High if wrong — this is the central unresolved finding of BUG-01's research; if a defect *does* exist and was simply missed by static reading, the reproduction task in the plan is the safety net that will surface it |
| A5 | GitHub Actions `ubuntu-latest` runners provide a working Docker daemon out-of-the-box sufficient for Testcontainers, per-matrix-job, without extra `services:`/docker setup steps | Architecture Patterns | Low — this is already how the *current* single-job CI works (Testcontainers via `TestUtilityDBContainer` already succeeds in `ci.yml` today); a matrix job is not architecturally different from the current job in this respect, just replicated N times |

**If this table is empty:** N/A — see entries above; all should be treated as needing at most a quick confirmation during planning/execution, not as blocking unknowns.

## Open Questions

1. **What is the actual error/stack trace for BUG-01 (#78)?**
   - What we know: The full client→server→Prisma filter pipeline was traced and shows no structural defect distinguishing Counterparty from the working Category filter. D-02's `"null"`-token theory is not reachable via the Counterparty filter's current UI (no such option exists in its list).
   - What's unclear: Whether the crash is a client-side React error (e.g., a render-time exception), a Blitz RPC/network error, a Prisma runtime error, or something specific to certain data states (e.g., a transaction whose `counterpartyId` references a deleted/orphaned `Counterparty` row — not directly tested this session).
   - Recommendation: The first plan task for BUG-01 should be a pure diagnosis task: run the app locally (or via a throwaway Cypress spec with `cy.on('uncaught:exception', ...)` to capture the error), exercise single-select, multi-select, and clear interactions against the Counterparty filter, and record the exact error before writing any fix code.

2. **Does `DatePicker.tsx`'s date field actually skip in Tab order, or only the Select fields?**
   - What we know: Source-level analysis suggests the date field's trigger wraps a real `<Button>` (natively focusable), architecturally different from the Select fields' bare-`<div>` trigger.
   - What's unclear: Whether the outer wrapping `<div>` (which Radix's `asChild` also clones `aria-*`/`onClick` handlers onto) introduces a *different* bug — e.g., a double-toggle on click (both the inner Button's onClick and the outer div's Radix-injected onClick firing on the same click event via bubbling) — this wasn't confirmed on-browser.
   - Recommendation: Test the date field explicitly during BUG-02 implementation, both for Tab-reachability and for correct open/close behavior on click, even though it's not the primary suspect.

3. **What shard count actually minimizes CI wall-clock time for this suite (D-09)?**
   - What we know: 14 spec files, roughly 37-186 lines each (no single dominant outlier), diminishing returns expected past 4-6 shards per CONTEXT.md's framing.
   - What's unclear: The actual empirical curve — runner startup/Testcontainers-boot overhead per shard vs. spec execution time saved — can only be measured via real CI runs (D-11 requires this), not estimated statically.
   - Recommendation: Start with 4 shards as a reasonable first measurement point, capture wall-clock time in `BASELINE.md`, and only invest in tuning up/down if the phase's time budget allows a second measurement pass.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|--------------|-----------|---------|----------|
| Docker daemon (for Testcontainers MySQL/Redis) | BUG-01 dynamic reproduction, any local Cypress E2E run | ✗ (Docker CLI present, daemon not running in this research sandbox: `failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine`) | Docker CLI v29.6.2 (client only) | None available in this research session — reproduction must happen during execution, on a machine/CI runner where the daemon is running |
| Node.js | All phases | ✓ | v24.14.0 (project requires 22+) | — |
| `gh` CLI (GitHub issue/PR access) | Reading GitHub issue context for #78/#76/#71 | ✓ | authenticated against `raphaelmue/financer-blitz` | — |
| npm registry access | Package legitimacy verification | ✓ | — | — |

**Missing dependencies with no fallback:**
- Docker daemon — blocks any dynamic reproduction of BUG-01 or a real local Cypress run during research. The plan MUST budget the reproduction step as an execution-time task (on a machine/CI environment with Docker available), not assume it was already done by this research.

**Missing dependencies with fallback:**
- None — the Docker gap has no viable fallback for *dynamic* reproduction; static analysis was used instead and its limits are documented throughout this file.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Cypress 15.10.0 (E2E + component), Vitest 3.2.4 (unit) |
| Config file | `cypress.config.ts` (e2e + component), `vitest.config.ts` (unit) |
| Quick run command | `yarn test:e2e` (full E2E, no fast single-spec shortcut currently defined — `cypress run --e2e --spec <path>` for a single spec during development) |
| Full suite command | `yarn test` (unit + component + e2e + coverage merge) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|---------------------|-------------|
| BUG-01 | Counterparty filter: single-select, multi-select, clear — no error, correct results | e2e | `cypress run --e2e --spec test/cypress/e2e/transactions.spec.ts` | ❌ Wave 0 — new `it(...)` block(s) needed in `test/cypress/e2e/transactions.spec.ts`, mirroring the existing Category filter test |
| BUG-02 | Tab/Shift+Tab through all date+select fields in visual order, no skip/trap | e2e | `cypress run --e2e --spec test/cypress/e2e/transactions.spec.ts` (or a new dedicated spec) | ❌ Wave 0 — new test using `cy.realPress('Tab')`/`cy.realPress(['shift','Tab'])`, requires `cypress-real-events` installed + registered in `test/cypress/support/e2e.ts` |
| TEST-01 | E2E suite runs measurably faster in CI, LCOV coverage ≥ baseline, 3+ consecutive green CI runs with no new flake | infra (CI-level, not a single automated local command) | GitHub Actions workflow run duration + `.test/lcov.info` diff, captured in `BASELINE.md` | ❌ Wave 0 — `BASELINE.md` doesn't exist yet (D-10); CI workflow restructuring is the "test" for this requirement |

### Sampling Rate
- **Per task commit:** `yarn test:unit` (fast) for any pure-logic changes; targeted `cypress run --e2e --spec <changed spec>` for UI fixes
- **Per wave merge:** `yarn test` (full suite) — note this will change shape once TEST-01's CI restructuring lands; until then, the existing sequential command still works locally
- **Phase gate:** Full suite green in CI (post-restructuring: all matrix shards + merge-coverage job green) before `/gsd-verify-work`, plus the 3-consecutive-run flake check from success criterion 4

### Wave 0 Gaps
- [ ] `test/cypress/e2e/transactions.spec.ts` — add Counterparty filter test cases (single/multi/clear) once BUG-01's actual behavior is understood
- [ ] `test/cypress/e2e/transactions.spec.ts` (or new spec) — add Tab/Shift+Tab order test using `cy.realPress`
- [ ] `test/cypress/support/e2e.ts` — register `cypress-real-events`'s commands (`import "cypress-real-events/support"`)
- [ ] `.planning/phases/01-bug-fixes-e2e-baseline/BASELINE.md` — does not exist yet; must be created from an actual CI run's numbers (D-10/D-11), not authored ahead of time
- [ ] Framework install: `yarn add -D cypress-split@1.25.0 cypress-real-events@1.15.0` (behind `checkpoint:human-verify`, see Package Legitimacy Audit)

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|----------------|---------|-------------------|
| V2 Authentication | No | Phase touches no auth code paths |
| V3 Session Management | No | Phase touches no session code paths |
| V4 Access Control | No | Phase touches no authorization rules (`src/lib/guard/ability.ts` untouched) |
| V5 Input Validation | Yes (pre-existing, no change needed) | `getTransactions.ts` already validates via `resolver.zod(GetTransactionsSchema)`; the `where` field uses `z.custom<TransactionWhereInput>()` (effectively pass-through) — this is an existing, unchanged pattern across the codebase, not something this phase should alter |
| V6 Cryptography | No | No crypto/token code touched |

### Known Threat Patterns for this stack (scoped to this phase's changes)

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|-----------------------|
| CI secrets exposure across matrix jobs | Information Disclosure | GitHub Actions automatically scopes repository secrets (`SONAR_TOKEN`, `SONAR_HOST_URL`) to every matrix job identically — no new exposure surface vs. the current single job; do not echo `DATABASE_URL` (contains a throwaway test-only password already committed in plaintext in `ci.yml`) into new log output when restructuring the workflow |
| Third-party CI dependency supply chain (`cypress-split`, `cypress-real-events`) | Tampering | Both packages verified via `package-legitimacy check` (OK verdict, no `postinstall` script, real GitHub source, high download counts) — still gate installation behind `checkpoint:human-verify` per this project's WebSearch-discovery provenance policy |

This phase introduces no new user-facing input surfaces, auth flows, or data-access patterns — the ASVS/threat-pattern surface is limited to CI supply-chain hygiene for the two new devDependencies.

## Sources

### Primary (HIGH confidence — direct codebase/node_modules reads this session)
- `src/lib/components/common/data/table/filters/SelectFilter.tsx`, `prisma-filter-builder.ts`, `registry.ts`, `types.ts` — full filter pipeline
- `src/app/(internal)/transactions/components/TransactionsList.tsx`, `TransactionForm.tsx` — filter config and form layout
- `src/lib/components/common/data/table/TableToolbar.tsx`, `DataTable.tsx`, `useDataTable.ts` — URL/state wiring
- `src/lib/components/common/form/elements/SelectField.tsx`, `SelectFormField.tsx`, `DatePicker.tsx`, `DatePickerFormField.tsx`, `FormElement.tsx` — Tab-order root cause
- `src/lib/components/ui/input-group.tsx` — confirms no `tabIndex` on the trigger element
- `src/lib/model/transactions/queries/getTransactions.ts`, `src/lib/model/counterparties/queries/getCounterparties.ts`, `src/lib/util/zod/zodUtil.ts` — server-side resolver path
- `src/lib/db/schema/transaction.prisma`, `counterparty.prisma` — confirms `counterpartyId` is a plain nullable scalar field
- `node_modules/@radix-ui/react-popover/dist/index.js`, `node_modules/@radix-ui/react-primitive/dist/index.js`, `node_modules/@radix-ui/react-primitive/node_modules/@radix-ui/react-slot/dist/index.js` — Radix `asChild`/Slot/PopoverTrigger internals
- `cypress.config.ts`, `test/utility/TestUtilityDBContainer.ts`, `.github/workflows/ci.yml`, `package.json`, `nyc.config.js` — E2E/CI infrastructure
- `test/cypress/e2e/transactions.spec.ts` — existing filter test pattern to mirror
- `.planning/codebase/TESTING.md`, `CONVENTIONS.md`, `STRUCTURE.md` — project conventions
- `.planning/research/PITFALLS.md` (Pitfall 8), `.planning/research/STACK.md` (Cypress/`cypress-split` section) — prior project-level research for this same milestone
- GitHub issues #78, #76, #71 (via `gh issue view`) — original bug reports, confirmed minimal detail/no repro steps

### Secondary (MEDIUM confidence — WebSearch cross-checked against 2+ independent sources this session)
- `cypress-split` npm/GitHub Actions matrix usage pattern (bahmutov/cypress-split)
- GitHub Actions build matrix strategy for Cypress without Cypress Cloud
- Radix UI `asChild`/Trigger accessibility responsibility (official Radix docs referenced in search results)
- LCOV/coverage merging pattern across parallel CI matrix jobs
- `cypress-real-events` vs `cypress-plugin-tab` reliability for native Tab-order testing

### Tertiary (LOW confidence)
- None retained as unqualified LOW-confidence claims — all WebSearch findings above were cross-checked (MEDIUM tier) or are marked `[ASSUMED]` per the package-name provenance rule in the Standard Stack/Package Legitimacy Audit sections.

## Metadata

**Confidence breakdown:**
- BUG-01 (Counterparty filter): LOW/unresolved — static analysis exhaustive but inconclusive; requires dynamic reproduction not possible in this research environment (no Docker daemon)
- BUG-02 (Tab navigation): HIGH — root cause verified via direct reads of three independent source layers (app code, `input-group.tsx`, Radix `node_modules` internals)
- TEST-01 (E2E parallelization): HIGH — architecture corroborated by this project's own independent prior research (`STACK.md`) plus fresh registry/legitimacy verification this session

**Research date:** 2026-08-21
**Valid until:** 30 days for the architecture/pattern findings (stable frameworks); the BUG-01 finding has no expiry in the usual sense — it remains "unresolved, needs reproduction" until an execution session with Docker available actually reproduces the crash
