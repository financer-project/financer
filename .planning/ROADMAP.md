# Roadmap: Financer

**Milestone:** v1.1.0
**Mode:** mvp (Vertical MVP)
**Granularity:** standard

## Overview

v1.1.0 takes Financer from "solid household finance tracker with two known bugs and a slow E2E suite" to "household finance tracker that also runs Splitwise-style shared-expense groups, on a modern Prisma 7 data layer." The journey is deliberately risk-ordered: first clear the two user-facing bugs and speed up the Cypress suite so there is a fast, trustworthy regression baseline (Phase 1); then do the Prisma 6→7 migration alone, spike-gated, with no new feature code in flight, so any regression has exactly one possible cause (Phase 2); then build the Splitting Groups bounded context against the already-stabilized v7 client in three vertical slices — the group/member/permanent-link foundation where the expensive-to-reverse money-type and token-model decisions get locked (Phase 3), the core expense → split → balance → settle loop that is the actual value proposition (Phase 4), and finally the time-limit and close semantics that define a group's end of life (Phase 5). Each Groups phase ships a slice a real user can open in a browser and use end to end, not a horizontal layer.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Bug Fixes & E2E Baseline** - Fix the counterparty filter and form tab navigation, and make the Cypress suite fast without losing coverage
- [ ] **Phase 2: Prisma 7 Migration & Dependency Refresh** - Move the whole app to Prisma 7 with a driver adapter, spike-gated, plus in-major updates for everything else
- [ ] **Phase 3: Splitting Groups — Foundation** - Organizer creates a group, adds members, and each member gets a working permanent personal link
- [ ] **Phase 4: Splitting Groups — Expenses, Splits, Balances & Settlement** - The complete shared-expense loop: record, split, see who owes whom per currency, settle up
- [ ] **Phase 5: Splitting Groups — Time Limits & Close Semantics** - Groups can be time-limited and closed; closed groups freeze new spending but stay viewable and settleable forever

## Phase Details

### Phase 1: Bug Fixes & E2E Baseline
**Goal**: Users can filter transactions by counterparty and move through forms with the keyboard without breakage, and the E2E suite that guards the rest of this milestone runs fast enough to trust and rerun
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: BUG-01, BUG-02, TEST-01
**Success Criteria** (what must be TRUE):
  1. User can filter the Transaction List by counterparty and see correctly filtered results, with no error thrown for any counterparty selection (including clearing the filter)
  2. User can Tab forward and Shift+Tab backward through a transaction form and focus lands on every date and select field in visual order, with no field skipped or trapped
  3. The Cypress E2E suite finishes in measurably less CI wall-clock time than the recorded pre-change baseline, with the before/after numbers captured
  4. LCOV coverage after the speed-up is equal to or higher than the pre-change baseline, and the sped-up suite passes 3+ consecutive CI runs with no new flake
**Plans**: 4 plans in 3 waves
Plans:
- [ ] 01-01-PLAN.md — BUG-01: reproduce the Counterparty filter failure end-to-end, then fix it to the correctness bar (wave 1)
- [ ] 01-02-PLAN.md — BUG-02: restore native Tab / Shift+Tab order through the transaction form's date and select fields (wave 1)
- [ ] 01-03-PLAN.md — TEST-01: record the pre-change CI baseline, then shard the E2E suite across a GitHub Actions matrix (wave 2)
- [ ] 01-04-PLAN.md — TEST-01: tune the shard count empirically, prove coverage parity and three-run stability, close out BASELINE.md (wave 3)
**Notes**: Prefer moving unit-testable logic into Vitest over cutting `retries.runMode` or `after()` cleanup (PITFALLS #8). If specs are parallelized, each worker needs its own database — the current single shared Testcontainers instance will corrupt data across workers. Plan 01-03 is sequenced after the two bug-fix plans deliberately: both add E2E specs, so capturing the baseline afterwards keeps the before/after comparison like-for-like.

### Phase 2: Prisma 7 Migration & Dependency Refresh
**Goal**: The entire existing application runs unchanged, from the user's point of view, on a Prisma 7 client with a driver adapter — with all other dependencies refreshed inside their current majors
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: DEPS-01, DEPS-02
**Success Criteria** (what must be TRUE):
  1. Every existing household workflow — login, transaction CRUD, filtering, CSV import, recurring templates, dashboard charts — works exactly as before against the Prisma 7 client
  2. Database errors still surface as the same user-facing messages and behavior as before (e.g. a duplicate/constraint violation shows its normal validation message instead of an unhandled crash), proving Blitz's `enhancePrisma` error mapping survived
  3. The full test suite (Vitest unit + Cypress E2E) passes with no test skipped, quarantined, or weakened to get it green
  4. No dependency other than Prisma crossed a major version boundary, and no remaining in-major updates are outstanding
**Plans**: TBD
**Notes**: **Hard go/no-go gate** — before committing to the migration, a throwaway-branch spike must prove `enhancePrisma(PrismaClient)` still works with the v7 driver-adapter constructor (PITFALLS #1). If it does not, stop and choose a fallback (manual error wrapping) before any of the 88 `@prisma/client` import sites are touched. Prefer one barrel re-export plus a scripted find/replace over hand-editing import sites. No Splitting Groups code may be in flight during this phase.

### Phase 3: Splitting Groups — Foundation
**Goal**: A registered organizer can stand up a real splitting group with real members, and every member — registered or not — can open their own permanent personal link and land in that group
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: GRP-01, GRP-02, GRP-03
**Success Criteria** (what must be TRUE):
  1. A logged-in user can create a Splitting Group with a name and an optional start/end period, and it appears in their list of groups
  2. The organizer can add members — either existing Financer users or non-registered participants identified by name — and see each member's personal access link to share
  3. Opening a member's personal link shows that member's group view (group name, who the link identifies them as, and what the link grants) with no login, signup, or session required
  4. A link belonging to one group or member is rejected when used against another group's or member's data, and an invalid or tampered token returns a generic denial that does not reveal whether the group exists
  5. Rapid repeated hits against the link-resolution endpoint are rate-limited instead of running unbounded, and no raw token appears in server logs
**Plans**: TBD
**UI hint**: yes
**Notes**: Locks the expensive-to-reverse decisions before Phase 4 builds on them: (a) **money type** — research conflicts here, STACK.md says follow the existing `Float` convention while PITFALLS #2 and SUMMARY.md say never `Float` for split math; resolve explicitly during planning, integer minor units or `Decimal` is the recommended answer; (b) **token model** — dedicated `hashedToken` (plus a revocation/rotation flag) on `SplittingGroupMember`, never the generic `Token` model (PITFALLS #3); (c) **currency-bucketed balance shape** (PITFALLS #7). Also confirm `generateToken()`'s entropy is adequate for a never-expiring credential, and set `Referrer-Policy: no-referrer` on token routes (PITFALLS #5).

### Phase 4: Splitting Groups — Expenses, Splits, Balances & Settlement
**Goal**: A group can actually be used for its purpose — members record shared expenses, split them across everyone or a subset, see exactly who owes whom in each currency, and settle up
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: GRP-04, GRP-05, GRP-06, GRP-07, GRP-08, GRP-09
**Success Criteria** (what must be TRUE):
  1. A member, via their personal link, can add an expense/income entry with description, amount, currency, payer and date, and it appears immediately in the group's expense list for every other member's link
  2. A member can split an expense equally across all group members or equally across a chosen subset, and the split shares always sum exactly to the expense amount — including odd amounts and awkward member counts (e.g. 10.01 across 3)
  3. A member can edit or delete an expense they created, and attempting to edit or delete another member's expense is refused
  4. Every member can see each member's running balance broken out per currency (never blended into a single number), and all balances net to zero within each currency
  5. A member can record a settlement between two members as a negative expense using a server-computed amount, after which both members' balances in that currency move toward zero and stay consistent even when two members act at the same time
**Plans**: TBD
**UI hint**: yes
**Notes**: Every resolver derives `{groupId, memberId}` from the token server-side and re-checks that the target expense/split belongs to that group before acting — never trust a client-supplied `groupId`/`memberId`/settlement amount (PITFALLS #4, #6). Balances are computed at read time from expense + split rows in one aggregated query, never stored as a running column (ARCHITECTURE Pattern 3). Index `groupId`/`memberId`/`expenseId` up front. Log `memberId` + action + timestamp for group mutations.

### Phase 5: Splitting Groups — Time Limits & Close Semantics
**Goal**: A group has a defined end of life — it can be time-limited and closed, after which the books are frozen for new spending but everyone can still look, settle, and use their link indefinitely
**Mode:** mvp
**Depends on**: Phase 4
**Requirements**: GRP-10, GRP-11
**Success Criteria** (what must be TRUE):
  1. An organizer can mark a group time-limited with a start/end period, and both organizer and members can see at a glance whether the group is open or closed
  2. Once the end date has passed or the organizer closes the group manually, any attempt to add a new expense/income entry is refused with a clear "this group is closed" explanation rather than a generic error
  3. After close, every member's permanent personal link still opens, still shows all expenses and per-currency balances, and still allows recording settlements — so stragglers can finish settling weeks later
**Plans**: TBD
**UI hint**: yes
**Notes**: Closing blocks new expense/income creation only. It must not revoke links, hide history, or block settlements (FEATURES.md dependency notes, REQUIREMENTS GRP-11). Verify with a UAT scenario that closes a group with outstanding debt and settles it to zero afterwards.

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Bug Fixes & E2E Baseline | 0/TBD | Not started | - |
| 2. Prisma 7 Migration & Dependency Refresh | 0/TBD | Not started | - |
| 3. Splitting Groups — Foundation | 0/TBD | Not started | - |
| 4. Splitting Groups — Expenses, Splits, Balances & Settlement | 0/TBD | Not started | - |
| 5. Splitting Groups — Time Limits & Close Semantics | 0/TBD | Not started | - |

## Requirement Coverage

| Phase | Requirements |
|-------|--------------|
| 1 | BUG-01, BUG-02, TEST-01 |
| 2 | DEPS-01, DEPS-02 |
| 3 | GRP-01, GRP-02, GRP-03 |
| 4 | GRP-04, GRP-05, GRP-06, GRP-07, GRP-08, GRP-09 |
| 5 | GRP-10, GRP-11 |

**Coverage:** 16/16 v1 requirements mapped, no orphans, no duplicates.

---
*Roadmap created: 2026-08-21*
