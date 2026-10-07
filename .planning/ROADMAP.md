# Roadmap: Financer

**Milestone:** v1.1.0
**Mode:** mvp (Vertical MVP)
**Granularity:** standard

## Overview

v1.1.0 takes Financer from "solid household finance tracker with two known bugs and a slow E2E suite" to "household finance tracker that also runs Splitwise-style shared-expense groups, on a modern Prisma 7 data layer." The journey is deliberately risk-ordered: first clear the two user-facing bugs and speed up the Cypress suite so there is a fast, trustworthy regression baseline (Phase 1); then do the Prisma 6->7 migration alone, spike-gated, with no new feature code in flight (Phase 2); then build the Splitting Groups bounded context against the already-stabilized v7 client in three vertical slices (Phases 3-5).

## Workflow

Per explicit owner decision (2026-10-07): **fresh start, one branch per feature/bug-fix, implemented and merged into `main`**. Main stays clean. No existing work branches (`planning/v1.1.0-onboard`, `fix/upgrade-prisma`, `feature/*`, `worktree-*`) are merged or reused; each item below is its own branch.

## Phases

- [ ] **Phase 1: Bug Fixes & E2E Baseline** - Fix the counterparty filter and form tab navigation, and make the Cypress suite fast without losing coverage
- [ ] **Phase 2: Prisma 7 Migration & Dependency Refresh** - Move the whole app to Prisma 7 with a driver adapter, spike-gated, plus in-major updates for everything else
- [ ] **Phase 3: Splitting Groups - Foundation** - Organizer creates a group, adds members, and each member gets a working permanent personal link
- [ ] **Phase 4: Splitting Groups - Expenses, Splits, Balances & Settlement** - The complete shared-expense loop: record, split, see who owes whom per currency, settle up
- [ ] **Phase 5: Splitting Groups - Time Limits & Close Semantics** - Groups can be time-limited and closed; closed groups freeze new spending but stay viewable and settleable forever

## Phase Details

### Phase 1: Bug Fixes & E2E Baseline

**Goal**: Users can filter transactions by counterparty and move through forms with the keyboard without breakage, and the E2E suite that guards the rest of this milestone runs fast enough to trust and rerun
**Depends on**: Nothing (first phase)
**Requirements**: BUG-01 (#78), BUG-02 (#76), TEST-01 (#71)
**Success Criteria** (what must be TRUE):

  1. User can filter the Transaction List by counterparty and see correctly filtered results, with no error thrown for any counterparty selection (including clearing the filter)
  2. User can Tab forward and Shift+Tab backward through a transaction form and focus lands on every date and select field in visual order, with no field skipped or trapped
  3. The Cypress E2E suite finishes in measurably less CI wall-clock time than the recorded pre-change baseline, with the before/after numbers captured
  4. LCOV coverage after the speed-up is equal to or higher than the pre-change baseline, and the sped-up suite passes 3+ consecutive CI runs with no new flake

**Branches (one per item, merged to main):**

- `fix/78-counterparty-filter` — BUG-01: reproduce the Counterparty filter failure end-to-end (dynamic reproduction, since static analysis is inconclusive), then fix to the correctness bar
- `fix/76-tab-navigation` — BUG-02: restore native Tab / Shift+Tab order through the transaction form's date and select fields (root cause: `SelectField.tsx` clones Radix `PopoverTrigger asChild` onto a non-focusable `<div>`)
- `chore/71-e2e-performance` — TEST-01: record the pre-change CI baseline, then parallelize/speed the E2E suite; prove coverage parity and stability

**Notes**: The known Tag filter defect (invalid `tagId` clause on `Transaction` which has no `tagId` scalar) is a suspected thrower adjacent to the Counterparty control; it is investigated during BUG-01 reproduction and fixed if it is the (or a) cause. If it turns out to be an independent defect, it is fixed within BUG-01's scope only if reachable from the reproduction; otherwise routed as a separate item.

### Phase 2: Prisma 7 Migration & Dependency Refresh

**Goal**: The entire existing application runs unchanged, from the user's point of view, on a Prisma 7 client with a driver adapter - with all other dependencies refreshed inside their current majors
**Depends on**: Phase 1
**Requirements**: DEPS-01, DEPS-02
**Success Criteria** (what must be TRUE):

  1. Every existing household workflow - login, transaction CRUD, filtering, CSV import, recurring templates, dashboard charts - works exactly as before against the Prisma 7 client
  2. Database errors still surface as the same user-facing messages and behavior as before (e.g. a duplicate/constraint violation shows its normal validation message instead of an unhandled crash), proving Blitz's `enhancePrisma` error mapping survived
  3. The full test suite (Vitest unit + Cypress E2E) passes with no test skipped, quarantined, or weakened to get it green
  4. No dependency other than Prisma crossed a major version boundary, and no remaining in-major updates are outstanding

**Branches:**

- `chore/deps-prisma-7` — spike-gated Prisma 6->7 migration plus in-major refresh of remaining deps

**Notes**: **Hard go/no-go gate** - before committing to the migration, a throwaway-branch spike must prove `enhancePrisma(PrismaClient)` still works with the v7 driver-adapter constructor. If it does not, stop and choose a fallback (manual error wrapping) before any `@prisma/client` import sites are touched. No Splitting Groups code may be in flight during this phase.

### Phase 3: Splitting Groups - Foundation

**Goal**: A registered user creates a group, adds members, and each member gets a working permanent personal link
**Depends on**: Phase 2
**Requirements**: SPLIT-01 (#67)
**Success Criteria** (what must be TRUE):

  1. Only a registered user can create a group
  2. Organizer can add members (registered or not); each member gets a unique permanent personal link
  3. Opening a personal link grants full participant access to that group (add/edit/delete own expenses, view balances and all expenses, settle debts)
  4. Group link keeps working after the group closes

**Branches:**

- `feature/67-splitting-groups-foundation`

### Phase 4: Splitting Groups - Expenses, Splits, Balances & Settlement

**Goal**: The complete shared-expense loop: record an expense/income, split it across all members or a subset, see who owes whom per currency, settle up
**Depends on**: Phase 3
**Requirements**: SPLIT-01 (#67)
**Success Criteria** (what must be TRUE):

  1. Expenses/income can be split across all members or a specified subset
  2. Each expense/income entry has its own currency (no group-wide single currency)
  3. Each member has a running balance (who owes whom); debts can be compensated, recorded as a "negative expense"
  4. Per-expense currency balances are aggregated/displayed correctly for the group's overall balance

**Branches:**

- `feature/67-splitting-groups-expenses`

### Phase 5: Splitting Groups - Time Limits & Close Semantics

**Goal**: Groups can be time-limited and closed; closed groups freeze new spending but stay viewable and settleable forever
**Depends on**: Phase 4
**Requirements**: SPLIT-01 (#67)
**Success Criteria** (what must be TRUE):

  1. Groups can have a start/end period
  2. Closed groups reject new expenses/income
  3. Closed groups remain fully viewable and settleable

**Branches:**

- `feature/67-splitting-groups-closure`

## Out of Scope (this milestone)

- Groups reusing the Household/account data model — keeps the household security/permission model isolated from public-link-based group access
- Group creation by non-registered/anonymous users — organizer must be an accountable, logged-in user; members can still join without registering

*Last updated: 2026-10-07 (fresh start, branch-per-item workflow)*
