# Phase 1: Bug Fixes & E2E Baseline - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-21
**Phase:** 1-Bug Fixes & E2E Baseline
**Areas discussed:** Counterparty filter fix, Tab navigation order, E2E parallelization approach, Baseline capture method

---

## Counterparty filter fix

| Option | Description | Selected |
|--------|-------------|----------|
| I have repro steps to share | You'll describe exactly how to trigger the crash | |
| Investigate from scratch | No known repro — research should reproduce it by testing filter interactions | ✓ |

**User's choice:** Investigate from scratch
**Notes:** No repro steps known; research/implementation must reproduce the crash themselves.

| Option | Description | Selected |
|--------|-------------|----------|
| Unrelated — investigate independently | Don't assume the "null" token gap is the cause | |
| Worth checking as a lead | Plausible cause but confirm via reproduction before committing | ✓ |

**User's choice:** Worth checking as a lead
**Notes:** The missing "null"/no-counterparty option in the filter's option list is a plausible lead but must be confirmed via reproduction, not assumed.

| Option | Description | Selected |
|--------|-------------|----------|
| Correctness, not just no-crash | Matches Phase 1 success criteria wording | ✓ |
| Just stop the crash | Minimal defensive fix | |

**User's choice:** Correctness, not just no-crash
**Notes:** Every counterparty must be selectable, clearing must work, results must match selection.

---

## Tab navigation order

| Option | Description | Selected |
|--------|-------------|----------|
| DOM/visual order top-to-bottom, left-to-right | Standard browser tab order, no custom tabIndex | ✓ |
| I have a specific field order in mind | Custom sequence different from visual layout | |

**User's choice:** DOM/visual order top-to-bottom, left-to-right

| Option | Description | Selected |
|--------|-------------|----------|
| Research should identify them | Test the whole form (date picker + Radix SelectField) | ✓ |
| I know which field(s) are broken | Named specific fields | |

**User's choice:** Research should identify them

| Option | Description | Selected |
|--------|-------------|----------|
| Exact reverse of forward order | Matches success criteria wording exactly | ✓ |
| Just functional, order can differ | Looser bar | |

**User's choice:** Exact reverse of forward order

---

## E2E parallelization approach

| Option | Description | Selected |
|--------|-------------|----------|
| GitHub Actions matrix (multiple runners) | Split specs across N parallel CI jobs, full isolation | |
| Single-job in-process sharding | Fewer runner-minutes, less isolation, more CPU contention | |
| You decide | Let research/planning pick based on runner limits, container cost, CI plan | ✓ |

**User's choice:** You decide
**Notes:** Deferred to Claude's discretion — see "Claude's Discretion" below.

| Option | Description | Selected |
|--------|-------------|----------|
| One Testcontainers MySQL instance per parallel worker | Matches existing Testcontainers pattern, no shared state risk | ✓ |
| You decide | Let research evaluate alternatives | |

**User's choice:** One Testcontainers MySQL instance per parallel worker

| Option | Description | Selected |
|--------|-------------|----------|
| Determine empirically | No fixed target — pick a shard count that meaningfully helps, record actual improvement | ✓ |
| I have a specific target in mind | Named shard count or time budget | |

**User's choice:** Determine empirically

---

## Baseline capture method

| Option | Description | Selected |
|--------|-------------|----------|
| Committed artifact in the phase directory | Durable markdown doc, referenceable by future phases/verifier | ✓ |
| Note in PR/commit description only | Lighter weight, not queryable later | |

**User's choice:** Committed artifact in the phase directory

| Option | Description | Selected |
|--------|-------------|----------|
| Actual CI run | Matches "CI wall-clock time" wording exactly | ✓ |
| Local timing is fine | Faster but not representative | |

**User's choice:** Actual CI run

---

## Claude's Discretion

- **E2E parallelization mechanism:** User deferred the choice between a GitHub Actions build matrix and single-job in-process sharding to research/planning judgment, to be decided based on GitHub Actions runner limits, Testcontainers startup cost per worker, and the project's current CI plan (no evidence of paid Cypress Cloud today).

## Deferred Ideas

None — discussion stayed within phase scope (counterparty filter fix, Tab navigation, E2E speed-up).
