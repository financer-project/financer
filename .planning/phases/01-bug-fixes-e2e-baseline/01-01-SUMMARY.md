---
phase: 01-bug-fixes-e2e-baseline
plan: 01
subsystem: testing
tags: [cypress, e2e, prisma, filters, transactions, blitz]

# Dependency graph
requires: []
provides:
  - "Permanent Cypress regression spec for the Transaction List's Counterparty filter (single-select, multi-select, toggle, clear/Reset, empty-result, ordering, household scope)"
  - "Confirmed diagnosis that BUG-01 (#78) has no defect in the Counterparty filter code path"
  - "Identification of a separate, out-of-scope defect in the Tag filter (property: tagId has no Transaction scalar) recorded in WINDOWS.md for /gsd-capture"
affects: [01-02, 01-03, 01-04]

# Actuals (#2632)
actuals:
  tokens: 1513
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - test/cypress/e2e/transactions.spec.ts

key-decisions:
  - "No production code change for BUG-01: Counterparty filter (SelectFilterStrategy + TransactionsList.tsx config) is structurally and behaviorally correct; the reported crash traces to the adjacent Tag filter, a genuinely separate defect."
  - "Tag filter defect (property: tagId with no Transaction scalar) recorded as an out-of-scope finding in .planning/WINDOWS.md rather than fixed in this plan, per the plan's explicit cross-plan scope boundary."

patterns-established: []

requirements-completed: [BUG-01]

coverage:
  - id: D1
    description: "Counterparty filter single-select, multi-select, toggle, clear/Reset, empty-result, ordering, and household-scope all work correctly with no thrown error"
    requirement: "BUG-01"
    verification:
      - kind: e2e
        ref: "test/cypress/e2e/transactions.spec.ts#should filter transactions by counterparty (multi-select) and reset"
        status: pass
    human_judgment: false
  - id: D2
    description: "Manual browser confirmation of Counterparty filter behavior with a clean console (VALIDATION.md Manual-Only Verification for BUG-01 root-cause reproduction)"
    verification: []
    human_judgment: true
    rationale: "Plan Task 2 <verify> includes an explicit <human-check> item; config.json sets human_verify_mode: end-of-phase, so this is deferred to end-of-phase UAT rather than blocking this plan."

duration: 33min
completed: 2026-08-21
status: complete
---

# Phase 1 Plan 1: Counterparty Filter Diagnosis & Regression Coverage Summary

**Diagnosed BUG-01 by dynamic reproduction against real Testcontainers MySQL/Redis: the Counterparty filter has no defect, but the adjacent Tag filter throws `PrismaClientValidationError: Unknown argument tagId`, and is the likely true source of the reported #78 crash.**

## Performance

- **Duration:** 33 min
- **Started:** 2026-08-21T21:44:38Z
- **Completed:** 2026-08-21T22:17:39Z
- **Tasks:** 2
- **Files modified:** 1 (`test/cypress/e2e/transactions.spec.ts`)

## BUG-01 diagnosis

**Reproducing interaction:** Selecting the **Tag** filter (`FilterConfig.property: "tagId"` in `src/app/(internal)/transactions/components/TransactionsList.tsx`), with or without any Counterparty selection active. Selecting the Tag filter alone — zero Counterparty interaction — is sufficient to reproduce the exact same crash.

**Verbatim error (from the dev-server RPC log, `getTransactions` resolver):**
```
Invalid `f.default.transaction.findMany()` invocation:
{
  where: {
    AND: [
      { tagId: { in: ["96cad666-6388-4c55-995b-7ce9db6d47e2"] } }
    ],
    account: { householdId: "fd04bde4-e366-492c-940c-282f5b86ebbd" }
  },
  ...
}
Unknown argument `tagId`. Did you mean `tags`? Available options are marked with ?.
PrismaClientValidationError
```
Client-side this manifests as a React error boundary ("Something went wrong! An error has occurred.") replacing the entire transactions page — the same generic crash surface a reporter interacting with the Counterparty filter (which sits directly next to the Tag filter in the same toolbar) could plausibly misattribute to Counterparty.

**Originating layer:** `TransactionsList.tsx`'s Tag `FilterConfig` (`property: "tagId"`), consumed by the shared `SelectFilterStrategy.getWhereClause` (`src/lib/components/common/data/table/filters/SelectFilter.tsx`), which builds `{ tagId: { in: [...] } }`. `Transaction` (`src/lib/db/schema/transaction.prisma`) has no `tagId` scalar field — tags are reached only via the `TransactonTags[]` relation (`tags`). The clause is therefore not a valid `Prisma.TransactionWhereInput`, and Prisma rejects it before hitting the database.

**Target file for the fix (out of scope for this plan):** the Tag `FilterConfig` at `src/app/(internal)/transactions/components/TransactionsList.tsx` (currently `property: "tagId"`) needs either a relation-aware filter strategy (e.g. `{ tags: { some: { tagId: { in: [...] } } } }`) or a dedicated strategy for to-many relation filters. This is a genuinely separate defect from Counterparty, reachable with zero Counterparty interaction, and is out of BUG-01's scope per the plan's own routing instruction. Recorded in `.planning/WINDOWS.md` (kind: `deviation`) to route through `/gsd-capture`.

**Escalation ladder results (all 7 steps from the plan, run against real Testcontainers seed + created data):**

| Step | Interaction | Result |
|---|---|---|
| Primary (single/multi/clear) | Select one counterparty, add a second, click Reset | **No error.** Correct row counts throughout. |
| 1 | Deselect counterparties one at a time down to zero (not via Reset) | **No error.** `counterpartyId` correctly drops from the URL; full list restored. |
| 2 | Select a counterparty with zero matching transactions | **No error.** Zero rows rendered. |
| 3 | Combine Counterparty + Account + Category filters | **No error.** Correct intersection. |
| 4 | Combine Counterparty filter + toolbar free-text search | **No error.** Correct combined result. |
| 5 | Deep-link a URL that already carries `counterpartyId=` | **No error.** Correct (zero-row, since no transaction referenced that counterparty at that point) result. |
| 6 | Put a `counterpartyId` in the URL for a different household's counterparty | **No error.** Zero rows — household isolation held. |
| 7 | Combine Counterparty + **Tag** filter | **Reproduces the crash** — traced to the Tag filter, not Counterparty (see above). |

D-02's `"null"`-token theory (from CONTEXT.md/RESEARCH.md) was not the cause: the Counterparty filter's option list has no `"null"` entry, so that code path is unreachable through the UI, confirmed by static reads and never entered during dynamic reproduction.

## Accomplishments
- Reproduced BUG-01 dynamically against a real MySQL/Redis Testcontainers instance (Docker was confirmed available at execution time, resolving the "no repro environment" gap noted in RESEARCH.md).
- Ran the plan's full seven-step escalation ladder; found the Counterparty filter itself defect-free across every step.
- Traced the one reproducible crash to a separate, pre-existing Tag filter defect (`property: "tagId"` with no matching Prisma scalar) and confirmed it reproduces independent of any Counterparty interaction.
- Added a permanent Cypress regression spec covering all seven `<behavior>` requirements from Task 2: single-select, multi-select, toggle, clear (both deselect-to-zero and Reset), empty-result, ordering, and household scope.
- Recorded the out-of-scope Tag filter finding in `.planning/WINDOWS.md` for `/gsd-capture` routing.

## Task Commits

Each task was committed atomically:

1. **Task 1: Drive one counterparty selection end-to-end and capture the actual failure** - `528c732` (test)
2. **Task 2: Fix the diagnosed defect so the Counterparty regression spec passes** - `7db35d4` (test)

_Note: Task 2 was scoped `tdd="true"`, but the diagnosis found no in-scope defect to fix — see "TDD Gate Compliance" below._

## Files Created/Modified
- `test/cypress/e2e/transactions.spec.ts` - Added `"should filter transactions by counterparty (multi-select) and reset"`, covering single-select, multi-select, toggle (including toggle-to-zero), Reset, empty-result, ordering (relative-order assertion against the unfiltered row list), and household-scope (every rendered Counterparty cell belongs to the standard household's seeded counterparties).

## TDD Gate Compliance

Task 2 carried `tdd="true"` and a `<behavior>` block. Per the standard RED → GREEN cycle, a failing test should precede any passing test. Here, extending the spec to cover toggle/empty-result/ordering/household-scope produced **passing** assertions on the first run — no RED phase occurred, because Task 1's diagnosis had already established that the Counterparty filter's behavior matches every item in `<behavior>` with zero code changes needed. This is the explicitly anticipated outcome documented in the plan's `planner_assumptions` #2 ("a 'no reproduction' outcome is a legitimate Task 1 result") and Task 2's own `<action>` text ("finish BUG-01 against the correctness bar in D-03" without touching the Tag filter). No `feat(...)` commit exists for Task 2 because no production code required a fix — only `test(01-01): extend Counterparty filter spec...` (`7db35d4`).

## Decisions Made
- No production code changes for BUG-01: `SelectFilterStrategy` (`SelectFilter.tsx`) and the Counterparty `FilterConfig` (`TransactionsList.tsx`) are correct as written; fixing them would have been speculative code with no failing behavior to justify it (explicitly warned against in RESEARCH.md's Pitfall 1 and Anti-Patterns section).
- The Tag filter's `tagId` defect is recorded as an out-of-scope finding rather than fixed here, per the plan's explicit cross-plan/task-scope boundary ("do not fix the Tag filter here — that is outside BUG-01's scope").

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed two test-authoring bugs in the new spec's setup during Task 1 iteration**
- **Found during:** Task 1 (writing and running the diagnostic spec)
- **Issue:** (a) The new test assumed transaction creation redirects to `/transactions?...` like the delete flow does; it actually redirects to the transaction detail page `/transactions/{id}`. (b) `cy.get("li a[href='/transactions']").click()` matched two elements (sidebar link + breadcrumb) on the detail page, failing with "can only be called on a single element".
- **Fix:** Assert `cy.url()` includes `/transactions/` after creation, then `cy.visit("/transactions")` to return to the list deterministically.
- **Files modified:** test/cypress/e2e/transactions.spec.ts
- **Verification:** Full spec run, exit 0.
- **Committed in:** 528c732 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (test-authoring bug in new diagnostic scaffolding, not application code)
**Impact on plan:** No scope creep — both fixes were in the new test file this plan owns, not pre-existing test/application code.

## Issues Encountered
- Local production build (`yarn build`) was required before the E2E run would start (`test:start:app` uses `blitz start`, which needs a `.next` production build; the environment had none pre-built). Ran `yarn build` once at the start of execution; not a plan deviation, just an environment prerequisite not called out in the plan.
- Diagnostic scaffolding (a multi-step escalation-ladder test file with steps 1-7 exercised individually, plus a Tag-filter-alone isolation test and a deep-link/stale-id test) was written, run, and then removed once the root cause was confirmed — per the plan's `artifacts_this_phase_produces` note that a spec-local diagnostic handler is "retained only if a legitimate assertion still needs it." Only the one permanent `it(...)` block remains.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- BUG-01 (#78) is resolved from the Counterparty filter's perspective: phase success criterion 1 is met — a permanent, passing Cypress spec proves correct filtering with no error across single-select, multi-select, toggle, clear, empty-result, ordering, and household scope.
- **Follow-up needed (out of scope, tracked in `.planning/WINDOWS.md`):** the Tag filter (`property: "tagId"` in `TransactionsList.tsx`) throws `PrismaClientValidationError` whenever selected, independent of Counterparty. This is very likely the actual root cause behind the originally-reported #78 crash, since Tag sits directly next to Counterparty in the same filter toolbar. Recommend routing through `/gsd-capture` for a follow-up fix (likely: change the Tag filter's Prisma clause to `{ tags: { some: { tagId: { in: [...] } } } }` via a relation-aware filter strategy, since `SelectFilterStrategy`'s scalar-only clause shape doesn't fit a to-many relation).
- Sibling plan 01-02 (Tab navigation fix in `SelectField.tsx`) was not touched by this plan — no file overlap occurred, so no cross-plan coordination was needed at execution time.
- Manual browser verification (Task 2's `<human-check>`) is deferred to end-of-phase UAT per `config.json`'s `human_verify_mode: end-of-phase`.

## Self-Check

- FOUND: test/cypress/e2e/transactions.spec.ts
- FOUND: 528c732 (git log)
- FOUND: 7db35d4 (git log)

## Self-Check: PASSED

---
*Phase: 01-bug-fixes-e2e-baseline*
*Completed: 2026-08-21*
