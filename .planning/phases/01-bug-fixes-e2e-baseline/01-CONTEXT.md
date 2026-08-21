# Phase 1: Bug Fixes & E2E Baseline - Context

**Gathered:** 2026-08-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Three fixes, no new capabilities:
1. Fix the counterparty filter crash on the Transaction List (GitHub #78)
2. Fix Tab/Shift+Tab keyboard navigation through date and select fields in transaction forms (GitHub #76)
3. Speed up the Cypress E2E suite via parallelization while keeping (or improving) LCOV coverage, with a recorded before/after baseline (GitHub #71)

</domain>

<decisions>
## Implementation Decisions

### Counterparty filter fix (#78)
- **D-01:** No known repro steps exist — research/implementation must reproduce the crash by exercising counterparty filter interactions (single select, multi-select, clearing the filter) against the current code.
- **D-02:** `SelectFilter.tsx` (`src/lib/components/common/data/table/filters/SelectFilter.tsx`) treats the string `"null"` as a magic token mapped to a real Prisma `null` (used today by Category's "Uncategorized" option). The Counterparty filter's option list in `TransactionsList.tsx` has no such entry. This is a plausible lead worth checking, but must be confirmed via actual reproduction before being treated as the root cause — don't assume it without verifying.
- **D-03:** Fix scope is correctness, not just "doesn't crash" — matches the Phase 1 success criteria wording ("correctly filtered results... no error thrown for any counterparty selection, including clearing the filter"). Every counterparty must be selectable, clearing must work, and results must match the selection.

### Tab navigation order (#76)
- **D-04:** Correct Tab order = standard DOM/visual order, top-to-bottom left-to-right, matching `TransactionForm.tsx`'s visual layout. No custom `tabIndex` scheme — just fix whatever currently breaks the native flow.
- **D-05:** No specific field named as broken — research must identify the trap/skip by testing the whole form, including the day-picker (react-day-picker) date field and the Radix-based `SelectField`/multi-select fields (`src/lib/components/common/form/elements/SelectField.tsx` and its usages in `TransactionForm.tsx`).
- **D-06:** Shift+Tab must retrace the **exact reverse** of the forward Tab path (not just "functional, no traps") — matches the Phase 1 success criteria wording exactly.

### E2E parallelization approach (#71)
- **D-07:** Claude's discretion on matrix-vs-in-job-sharding (see Claude's Discretion below).
- **D-08:** Per-worker DB isolation: **one Testcontainers MySQL instance per parallel worker.** Today `TestUtilityDBContainer.ts` (`test/utility/TestUtilityDBContainer.ts`) is a single shared instance — the ROADMAP phase notes this will corrupt data across workers if parallelized without isolation. Each parallel worker/job must get its own container, matching the existing Testcontainers pattern. — **Reversibility:** reversible — isolation strategy is a test-infra internal, not a published contract.
- **D-09:** No fixed shard count or time target. Determine empirically: pick a shard count that meaningfully cuts CI wall-clock time without excessive runner overhead (diminishing returns expected past ~4-6 shards for the current 14 spec files), and record the actual measured improvement.

### Baseline capture method
- **D-10:** Baseline must be a **committed artifact** in the phase directory (e.g. a `BASELINE.md`-style doc) — not just a PR/commit description note — so it's durable and referenceable by the phase verifier and future phases.
- **D-11:** Baseline numbers (CI wall-clock time, LCOV coverage) must come from an **actual CI run** (push a baseline commit, read GitHub Actions' reported duration/coverage), not a local timing measurement — matches the success criteria's "CI wall-clock time" wording; local dev-machine timing isn't representative of CI runner performance.

### Claude's Discretion
- **Parallelization mechanism (D-07):** User deferred to research/planning judgment between a GitHub Actions build matrix (multiple runners, full isolation, no paid Cypress Cloud needed) and single-job in-process sharding (e.g. `cypress-split`, fewer runner-minutes but more CPU contention and less isolation per machine). Decide based on GitHub Actions runner limits, Testcontainers startup cost per worker, and the project's current CI plan (no evidence of a paid Cypress Cloud subscription today).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Codebase maps (existing brownfield analysis)
- `.planning/codebase/TESTING.md` — test framework, file organization, Cypress/Vitest patterns, coverage config
- `.planning/codebase/CONVENTIONS.md` — naming, code style, import organization
- `.planning/codebase/STRUCTURE.md` — directory/module layout

### Filter system (relevant to #78)
- `src/lib/components/common/data/table/filters/SelectFilter.tsx` — select filter strategy, `"null"` token handling
- `src/lib/components/common/data/table/filters/prisma-filter-builder.ts` — builds Prisma `where` from filter config
- `src/lib/components/common/data/table/filters/registry.ts` — filter strategy registry
- `src/app/(internal)/transactions/components/TransactionsList.tsx` — filter config, including the Counterparty filter definition (lines ~72-79)

### Transaction form (relevant to #76)
- `src/app/(internal)/transactions/components/TransactionForm.tsx` — the form with date and select fields affected by Tab navigation

### E2E/CI infrastructure (relevant to #71)
- `cypress.config.ts` — E2E config, `TestUtilityDBContainer` wiring, retries/timeouts
- `test/utility/TestUtilityDBContainer.ts` — current single shared DB container instance
- `.github/workflows/ci.yml` — current sequential single-job CI test run
- `test/cypress/e2e/` — 14 existing spec files to be sharded

### GitHub Issues
- #78 — Counterparty filter crash
- #76 — Tab key navigation broken in forms
- #71 — Cypress E2E suite performance

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `SelectFilter.tsx`'s `"null"` token pattern (already used by the Category filter's "Uncategorized" option) — a directly reusable pattern if the Counterparty filter needs a "no counterparty" option.
- `TestUtilityDBContainer` (Testcontainers-based MySQL lifecycle management) — existing pattern to replicate per-worker rather than replace.

### Established Patterns
- Filter strategy pattern (`registry.ts` + per-type strategy files) governs how each `FilterConfig` becomes a Prisma `where` clause — any filter fix should stay within this strategy pattern rather than special-casing Counterparty.
- Cypress E2E specs currently run as one sequential `cypress run --e2e` job (`.github/workflows/ci.yml`), coordinated by `start-server-and-test`, with a single `TestUtilityDBContainer` instance shared across all specs in the run.

### Integration Points
- CI workflow (`.github/workflows/ci.yml`) is the integration point for any parallelization change — it currently has one `ci` job with no matrix strategy.
- `TransactionsList.tsx` is the integration point for the Counterparty filter fix — filter config is defined inline alongside Account, Category, Tag, and CSV Import filters.

</code_context>

<specifics>
## Specific Ideas

No specific implementation prescribed beyond the decisions above — user deferred investigation (repro, trap identification, parallelization mechanism) to research/implementation, with clear correctness and measurement bars set by the decisions.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 1-Bug Fixes & E2E Baseline*
*Context gathered: 2026-08-21*
