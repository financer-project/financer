# Project Research Summary

**Project:** Financer
**Domain:** Personal/household finance management (Next.js/Blitz.js/Prisma/MySQL), adding a Splitwise-style shared-expense feature
**Researched:** 2026-08-21
**Confidence:** MEDIUM-HIGH

## Executive Summary

Financer v1.1.0 adds a Splitwise-style shared-expense "Splitting Group" feature alongside a mandatory Prisma 6→7 migration and two bug fixes. Research confirms a well-defined, locked feature scope (equal/subset splits, per-expense currency, permanent personal access links, settlement-as-negative-expense) that requires almost no new dependencies. The dominant risk in this milestone is the Prisma 7 migration itself: it removes the bundled Rust query engine, mandates a driver adapter (`@prisma/adapter-mariadb`) even for MySQL, changes the client generator/output path, and touches 88+ files that import `@prisma/client` directly — its compatibility with Blitz.js's `enhancePrisma()` wrapper is unverified and must be spiked before committing to the migration.

The recommended approach is three risk-isolated phases in sequence: (1) the two bug fixes plus the Cypress performance work, establishing a clean regression baseline; (2) the Prisma v7 migration on its own, spike-gated, with no new feature code in flight; (3) the Splitting Groups domain, built from day one against the stabilized v7 client as a fully separate bounded context (own schema, own token-based auth, zero coupling to Household/Account/Transaction).

Key risks to mitigate: monetary rounding errors if amounts stay `Float` (existing `Transaction.amount` convention — must not be repeated for Groups), IDOR if token-resolved requests don't re-verify resource ownership, token leakage/lack of rate limiting (the app has zero rate limiting today), balance-computation races from concurrent unauthenticated participants, and multi-currency balances that must stay currency-bucketed rather than blended into one misleading number.

## Key Findings

### Recommended Stack

Prisma 6.19.2 → **7.9.1** is the only approved major-version bump this milestone. It requires `@prisma/adapter-mariadb@7.9.1` + `mariadb@3.5.3` as the driver adapter (not `@prisma/adapter-mysql2`), a new `prisma.config.ts` replacing `schema.prisma`'s `url`/`directUrl` and the `package.json` seed block, a generator change (`prisma-client` provider with mandatory `output` path, breaking existing `@prisma/client` imports and the `next.config.ts` webpack externals entry), and an upgrade of `prisma-mock` from 0.10.3 (incompatible) to 1.1.0 (new `prisma-mock/client` entry point, affecting all resolver unit tests). For Cypress performance, `cypress-split` (GitHub Actions matrix sharding, no Cypress Cloud dependency) plus disabling `video` in `runMode` is recommended over a Playwright migration, which would violate the "Prisma is the only major change" constraint. The Splitting Group feature needs almost no new dependencies: Node's built-in `crypto.randomBytes` (base64url) for permanent access tokens instead of `nanoid`, a hand-rolled greedy debt-simplification algorithm instead of the unmaintained `splitwise-js-map`, and the existing `currency-codes` dependency for currency validation — currency conversion is deliberately not adopted since no conversion requirement exists yet.

**Core technologies:**
- `@prisma/adapter-mariadb` 7.9.1 + `mariadb` 3.5.3 — required driver adapter for Prisma 7 on MySQL — mandatory, no bundled engine anymore
- `prisma-mock` 1.1.0 — Prisma 7-compatible test mocking — 0.10.3 is incompatible with v7's peer deps
- `cypress-split` 1.25.0 — CI matrix sharding for E2E — speeds up Cypress without a Cypress Cloud subscription
- `node:crypto` (built-in) — permanent member access tokens — no new dependency needed, sufficient entropy via `randomBytes`

### Expected Features

Splitwise-style group splitting has one core computation (allocate a total across a weighted subset of members) with common input modes of equal / exact amount / percentage / shares; this milestone's locked scope (equal-all or equal-subset) is the minimal correct slice of that, with exact/%/shares as a natural low-cost v1.x extension of the same data model. Debt simplification is NP-complete in general and real products use greedy heuristics as a display-layer "suggested settlements" feature — correctly deferred out of v1.1.0. Per-currency balance tracking without forced conversion matches Splitwise's own default behavior and validates the locked "no group-wide currency" decision directly.

**Must have (table stakes) for v1.1.0:**
- Group creation by registered users; organizer adds members (registered or name-only)
- Permanent personal access link per member (never expires, survives group close)
- Add expense: amount, per-entry currency, payer, date, split type
- Equal split across all members or a specified subset
- Per-currency running balance per member, computed (not stored)
- Edit/delete own expenses; view all expenses/balances via any member link
- Settlement recorded as a "negative expense" (same data shape, inverted effect)
- Time-limited group (start/end date); links stay valid after close

**Should have (differentiators, v1.x fast-follow):**
- Custom split by exact amount, percentage, or shares
- Debt simplification (greedy "suggested settlements" display layer)

**Defer / anti-features (not v1.1.0, not this domain):**
- Real-money payment processing
- Single blended/converted group currency (contradicts locked per-expense-currency decision)
- Sharing the Household/Account data model with Groups (security boundary violation)
- Anonymous (non-registered) group creation
- Recurring group expenses (would couple domains)

### Architecture Approach

Splitting Groups should be a fully parallel bounded context: its own `src/lib/db/schema/splittingGroup.prisma` with zero foreign keys into Household/Account/Transaction, its own `src/lib/model/splittingGroup/{queries,mutations,services}` following existing conventions, and no involvement of `src/lib/guard/ability.ts` (CASL/household roles). Non-registered, session-less member access is handled via a new `resolveMemberToken()` resolver-pipe step that replaces `resolver.authorize()` — precedented by the existing `forgotPassword.ts` public resolver. Permanent tokens live as a `hashedToken` column directly on a new `SplittingGroupMember` model (reusing only `generateToken()`/`hash256()` utilities), not the generic `Token` model, which requires non-null `userId` and `expiresAt` and doesn't fit permanent, possibly-anonymous links. Balances are computed at read time from expense/split rows — matching the existing no-event-sourcing, derived-balance pattern — never stored as running fields.

**Major components:**
1. `SplittingGroup` + `SplittingGroupMember` (with `hashedToken`) — group/membership data, organizer vs. token-based identity
2. `SplittingGroupExpense` + `SplittingGroupExpenseSplit` — expense entries and per-member split allocations, per-currency
3. `resolveMemberToken()` resolver-pipe step — token-to-identity resolution replacing session-based `resolver.authorize()` for the public access path

### Critical Pitfalls

1. **Prisma 7 breaks `enhancePrisma()` + 88 import sites** — spike-test `enhancePrisma(PrismaClient)` with the driver adapter on a throwaway branch before committing to the migration; hard go/no-go gate.
2. **Float amounts cause rounding errors in split math** — use integer cents or Prisma `Decimal` (never `Float`) for all Group monetary fields; unit test `sum(splits) === amount` across odd participant counts and odd amounts.
3. **Reusing the generic `Token` model for permanent links** — build a dedicated `hashedToken` column on `SplittingGroupMember`; reuse only `generateToken()`/`hash256()` primitives, not the `Token` table (which assumes non-null `userId`/`expiresAt`).
4. **IDOR via token-based access** — every resolver must derive identity from the token server-side, then re-check that the target resource actually belongs to that token's `groupId`/`memberId`; test cross-group/cross-member token misuse explicitly.
5. **Token leakage and zero rate limiting** — the app has no rate limiting anywhere today; add Redis-backed rate limiting to the token-resolution endpoint, set `Referrer-Policy: no-referrer` on token routes, and scrub tokens from logs before shipping permanent bearer-token access.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Bug Fixes & Test Baseline
**Rationale:** Smallest, most isolated work; establishes a clean regression baseline before larger, riskier changes land.
**Delivers:** Counterparty filter fix (#78), tab-navigation fix (#76), Cypress E2E performance improvements (#71) via `cypress-split` + disabled video, with an explicit coverage-diff gate so speed gains don't silently cut coverage.
**Addresses:** #78, #76, #71
**Avoids:** Naive Cypress "speed up" pitfalls (shared Testcontainers DB corruption, cut retries hiding flakiness) by preferring "move logic to Vitest" over cutting cleanup/retries.

### Phase 2: Prisma 6 → 7 Migration
**Rationale:** A wide, mechanical, high-blast-radius change (88+ files) best done in isolation with no new feature code in flight — bundling it with the new domain would make regressions impossible to root-cause, and building Groups first would mean rewriting it during the migration.
**Delivers:** Working app on Prisma 7.9.1 with `@prisma/adapter-mariadb`, `prisma.config.ts`, updated generator/output path, updated `next.config.ts` webpack externals, and `prisma-mock` 1.1.0 across all resolver unit tests.
**Uses:** `@prisma/adapter-mariadb` 7.9.1, `mariadb` 3.5.3, `prisma-mock` 1.1.0
**Research flag:** Requires a short spike (1-2 days) verifying `enhancePrisma()` works with the v7 driver-adapter pattern before full execution — treat as a go/no-go gate, not documentation review.

### Phase 3: Splitting Groups — Foundation (Schema, Auth, Tokens)
**Rationale:** Schema and authorization decisions (money type, token model, currency bucketing) are foundational and expensive to change once expense/balance logic is built on top of them — must be locked before Phase 4.
**Delivers:** `SplittingGroup`/`SplittingGroupMember`/`SplittingGroupExpense`/`SplittingGroupExpenseSplit` Prisma models (integer cents or `Decimal`, never `Float`), `resolveMemberToken()` resolver-pipe step, rate-limited token-resolution endpoint, referrer-policy header on token routes.
**Implements:** Token-gated resolver pattern (architecture component 3), dedicated permanent-token model (avoids pitfall 3)
**Avoids:** Float rounding errors (pitfall 2), Token-model misuse (pitfall 3), token leakage/no rate limiting (pitfall 5)

### Phase 4: Splitting Groups — Expenses, Splits & Balances
**Rationale:** Core user-facing capability; depends on Phase 3's schema/auth foundation being stable.
**Delivers:** Organizer mutations (create group, add member, close group), member mutations (create/edit/delete own expense, record settlement), balance queries computed per-currency at read time, settlement UI ("negative expense").
**Addresses:** Table-stakes features from FEATURES.md — group creation, expense entry, equal/subset split, per-currency balances, settlement
**Avoids:** IDOR (pitfall 4 — every resolver re-checks resource ownership after token resolution), concurrent-edit balance races (compute balances inside a transaction; settlement mutations re-fetch server-side), multi-currency blending (balances stay currency-bucketed, never summed across currencies)

### Phase Ordering Rationale

- Bug fixes first because they're small, independent, and establish a trustworthy baseline before higher-risk work
- Prisma migration isolated in its own phase because its blast radius (88+ files, generator/import changes) would make diagnosing regressions in a concurrently-developed new domain impossible
- Splitting Groups foundation (schema/auth) separated from expense/balance logic because money-type and token-model decisions are expensive to reverse once built upon
- Security-sensitive work (IDOR, rate limiting, token handling) is designed into the first resolvers in Phase 3, not retrofitted in Phase 4

### Research Flags

Phases likely needing deeper research/spike during planning:
- **Phase 2 (Prisma migration):** Needs a dedicated spike verifying `enhancePrisma()` compatibility with the v7 driver-adapter pattern — single web-sourced claim, not yet cross-verified against this repo's exact Blitz integration.
- **Phase 3 (Groups foundation):** Needs a product decision on exact split-allocation strategy (equal-only vs. weighted) and what "closing" a time-limited group actually restricts (new expenses vs. settlements vs. both) before schema is finalized.

Phases with standard, well-documented patterns (skip research-phase):
- **Phase 1 (bug fixes/Cypress):** Established Cypress performance patterns (`cypress-split`, video-disable), no novel research needed.
- **Phase 4 (expenses/balances):** Split/balance computation patterns are well-documented via Splitwise's own public behavior and this codebase's existing derived-balance conventions.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | Prisma 7 breaking changes verified against official docs + npm registry; Cypress/Groups-stack recommendations cross-checked across multiple community sources |
| Features | MEDIUM | Corroborated across Splitwise's own help center and independent technical write-ups; no official engineering documentation exists publicly |
| Architecture | HIGH for patterns (directly derived from this codebase); LOW for Prisma 7 breaking-change specifics (single source, flagged for re-verification) |
| Pitfalls | HIGH for codebase-specific findings (read directly from source); MEDIUM for Prisma 7 external claims (cross-checked web search) |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- Whether Blitz.js 2.2.1's `enhancePrisma()` actually functions against a Prisma 7 client with a driver adapter — unverified, needs an early spike before Phase 2 is scoped/estimated
- How per-expense-currency balances are aggregated/displayed at the group level — no conversion mechanism exists in the codebase; resolve as a product/design decision before Phase 4, not a library choice
- Exact split-allocation strategy (equal-only vs. weighted/custom shares) — locked scope says "subset of members" but schema should confirm equal-only for v1.1.0 before Phase 3 is planned
- What exactly "closing" a time-limited group blocks (new expenses) versus what must stay live (links, viewing, settling existing debts) — needs an explicit product decision, flagged during Phase 3 planning
- Exact entropy/length guarantees of `@blitzjs/auth`'s `generateToken()` as a *permanent, never-expiring* credential — worth a quick confirmation during Phase 3's security design step

## Sources

### Primary (HIGH confidence)
- Prisma official documentation (fetched directly) — Prisma 7 driver adapter requirements, generator/config changes
- npm registry — confirmed `prisma@7.9.1`, `@prisma/adapter-mariadb@7.9.1` as real published versions
- Direct repository reads — `ARCHITECTURE.md`, `STRUCTURE.md`, `STACK.md`, `TESTING.md`, `CONCERNS.md`, `src/lib/guard/ability.ts`, `src/lib/model/*/mutations/forgotPassword.ts`, `src/lib/model/*/mutations/addOrInviteHouseholdMember.ts`, `cypress.config.ts`, `next.config.ts`, `package.json`, `schema.prisma`

### Secondary (MEDIUM confidence)
- Splitwise official help center — per-currency balance behavior, settle-up UX
- Community technical write-ups (multiple, cross-checked) — `cypress-split` adoption pattern, debt-simplification heuristic consensus, guest/link access patterns (SplitCost, Splitceipt)

### Tertiary (LOW confidence)
- Single WebSearch result on Prisma 6→7 breaking changes not yet cross-verified hands-on against this repo's exact `enhancePrisma()` interaction — flagged for a dedicated spike before Phase 2 execution

---
*Research completed: 2026-08-21*
*Ready for roadmap: yes*
