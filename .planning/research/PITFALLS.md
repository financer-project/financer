# Pitfalls Research

**Domain:** Adding to an existing Blitz.js/Next.js/Prisma(MySQL)/Redis household-finance app: bug fixes, Prisma 6→7 migration, Cypress performance work, and a new tokenized-link "Splitting Group" (Splitwise-style) domain.
**Researched:** 2026-08-21
**Confidence:** MEDIUM (codebase claims are HIGH — read directly from source; Prisma 7 claims are MEDIUM — cross-checked web search, verify against `prisma migrate diff`/`prisma validate` output during the actual migration spike)

## Critical Pitfalls

### Pitfall 1: Prisma 7's mandatory driver adapter + generator change breaks Blitz's `enhancePrisma` wrapper and every `@prisma/client` import

**What goes wrong:**
Prisma 7 removes the Rust query engine entirely. The `PrismaClient` constructor now requires a **driver adapter** (e.g. `@prisma/adapter-mariadb`/`@prisma/adapter-mysql`) to be passed explicitly — for *all* databases, not just Postgres. The generator also changes from `prisma-client-js` to `prisma-client`, `output` becomes a required field, and the client is no longer generated into `node_modules`. This repo's `src/lib/db/index.ts` does `import { PrismaClient } from "@prisma/client"` and wraps it as `enhancePrisma(PrismaClient)` from the `blitz` package (v2.2.1, unmaintained relative to Prisma's pace) with no adapter passed — this will not construct correctly against a v7 client. Additionally, **88 files across `src/`** (confirmed by search) import types/enums (`Prisma`, `Role`, `TokenType`, `HouseholdRole`, etc.) directly from `@prisma/client`, and `next.config.ts` explicitly externalizes `@prisma/client` as a native Node dependency for Webpack. All of these assumptions break simultaneously.

**Why it happens:**
Teams treat major Prisma bumps as "update the version, run generate" because that's how v4→v5→v6 worked. v7 is architecturally different (Rust-free, ESM-only client, adapter-based connections) — it's a bigger jump than the version number suggests, and Blitz.js's `enhancePrisma` helper (used for Blitz's automatic Prisma-error-to-HTTP mapping) has not been updated for this era of Prisma and may not have been tested against it upstream.

**How to avoid:**
- Treat this as a spike-first migration, not a version bump: build a throwaway branch that (1) adds `@prisma/adapter-mariadb` (or `-mysql`), (2) switches the generator to `prisma-client` with an explicit `output` under `src/lib/db/generated/`, (3) adds `prisma.config.ts`, and (4) verifies `enhancePrisma(PrismaClient)` actually still intercepts Prisma errors as Blitz expects — this is the highest-risk unknown and should be proven before committing to the migration.
- Add a single barrel re-export (e.g. `src/lib/db/prisma-types.ts` re-exporting everything from the new generated path) and do one scripted find/replace of all 88 `@prisma/client` import sites to point at it, rather than hand-editing each file — reduces both effort and the chance of missing one.
- Update `next.config.ts` Webpack externals to the new generated output path; verify server bundling doesn't break on the ESM `.js`-extension imports Prisma 7 generates (a known Webpack pain point — generated files import `./foo.js` for TS source that doesn't exist as `.js` at build time).
- Re-verify the multi-file schema setup (`src/lib/db/schema/*.prisma`, already flagged as non-standard in CONCERNS.md) still concatenates/validates correctly with the new generator and required `output` field before assuming it "just works."
- Migrate `$use` middleware to `$extends` if any exists (checked: none currently in `src/lib/db`, but re-check before merging since this could silently regress).

**Warning signs:**
- `prisma generate` succeeds but `enhancePrisma(PrismaClient)` throws or silently stops converting Prisma errors into the expected Blitz `NotFoundError`/validation shape.
- TypeScript errors across dozens of unrelated files the moment the generator/output path changes (signals the import-path blast radius wasn't fully addressed).
- Webpack build fails only in `next build` (not `tsc`) with module-not-found on `.js` files that correspond to `.ts` source — this is the ESM-generated-imports issue, not a config mistake.

**Phase to address:** Prisma migration phase — should be its own isolated phase, sequenced *before* the Splitting Group phase (new domain should be written directly against the v7 client so it isn't touched twice), and ideally before or independent of the bug-fix phase so bug fixes aren't blocked on migration risk.

---

### Pitfall 2: New Splitting Group money fields inherit the existing `Float` amount anti-pattern, compounding rounding errors in split math

**What goes wrong:**
The existing `Transaction.amount` field is typed `Float` in Prisma/MySQL (confirmed in `src/lib/db/schema/transaction.prisma`). For simple single-entry transactions this mostly "works" by accident. Splitting Group logic is categorically riskier: dividing one expense amount across N participants, summing per-member running balances across many expenses, and computing "who owes whom" settlement amounts all involve repeated arithmetic on the same values. `Float`/IEEE-754 rounding error compounds with each operation, and split remainders (e.g. €10.00 / 3 people) don't divide evenly in any base — if this isn't handled explicitly, balances will drift by cents and, worse, `sum(splits) !== expense.amount`, which breaks the core trust promise of a debt-tracking feature.

**Why it happens:**
Copy-pasting the existing `Transaction` schema pattern feels consistent with "follow existing conventions," but the existing pattern was never validated for split arithmetic — it was designed for single ledger entries, not group math.

**How to avoid:**
- Store split-group monetary amounts as integer minor units (cents) or Prisma `Decimal` (MySQL `DECIMAL`), not `Float`. Given this is a brand-new domain with no legacy data, there's no migration cost to doing it right from day one — don't inherit the Household/Transaction domain's Float debt.
- Define an explicit, tested remainder-distribution algorithm for splits (e.g., largest-remainder method: divide integer-cents evenly, then distribute the leftover 1-cent units to the first N participants in a deterministic, documented order) so `sum(participant shares) === expense.amount` is a system invariant, not a hope.
- Add a unit test that asserts this invariant for a wide matrix of amounts/participant counts (including primes like 3, 7 participants) as a required deliverable of the Splitting Group phase, not an afterthought.
- Keep balance aggregation as a pure function operating on integer/Decimal arithmetic; do not accumulate balances via repeated JS float addition even if amounts are stored correctly, since Decimal→Number coercion for calculation reintroduces the bug.

**Warning signs:**
- QA/UAT sees a group's total balance not netting to zero when it should (in a closed system, sum of all members' balances must always equal 0).
- Settlement suggestion UI shows amounts like `€3.3300000000000004`.
- Split totals don't match the original expense amount by a cent after saving/reloading.

**Phase to address:** Splitting Group domain phase — schema design step specifically, before any business logic is written against it.

---

### Pitfall 3: Reusing the existing `Token` model/pattern for permanent group-member links creates security and semantic mismatches

**What goes wrong:**
The codebase already has a token pattern (`Token` model, `generateToken()` + `hash256()` from `@blitzjs/auth`, seen in `inviteUser.ts`) that's tempting to reuse for group-member access links. But that model requires `userId` (non-null, FK to `User`) and `expiresAt` (non-null) — it was built for time-limited, user-scoped invitation flows, not permanent, unauthenticated, non-registered-user access. Force-fitting it (e.g., pointing `userId` at the organizer, or setting `expiresAt` to a far-future date) creates a token whose semantics don't match its use: it becomes ambiguous whether the token identifies "the organizer's invitation" or "this specific member's permanent access," and any code path that reasons about `Token.type` for the *existing* auth flows (password reset, household invitations) now has to defensively exclude a token kind it was never designed to see.

**Why it happens:**
"There's already a token system, let's extend the enum" looks like reuse but is actually coupling two different security models (ephemeral, user-tied verification tokens vs. permanent, anonymous, capability-bearing access links) through one table.

**How to avoid:**
- Create a dedicated model (e.g. `GroupMemberLink`) scoped to the Splitting Group domain, consistent with the PROJECT.md decision that "Groups are a domain fully separate from Households." It should have: a nullable `userId` (registered members link to a `User`; non-registered members don't), no `expiresAt` (or an explicit `revokedAt`/`isActive` flag instead, since these links are permanent by requirement and must keep working after the group closes), and a token that is a bearer-capability, not an identity-verification proof.
- Generate the token with `generateToken()` from `@blitzjs/auth` (same CSPRNG-backed primitive already vetted in this codebase) but store only `hash256(token)`, exactly as the existing pattern does — reuse the *primitive*, not the *model*.
- Explicitly design for revocation: a member removed from a group (or an organizer needing to rotate a compromised link) must be able to invalidate a specific link without affecting others — add a status/active flag now, since retrofitting revocation onto "permanent" links later is a breaking change for anyone who already has the link bookmarked.

**Warning signs:**
- Auth code has to add `type !== TokenType.GROUP_MEMBER_LINK` checks anywhere in the existing password-reset/household-invitation flows to avoid cross-talk.
- No way to deactivate a leaked group link short of deleting the whole group.

**Phase to address:** Splitting Group domain phase — schema/access-model design step.

---

### Pitfall 4: Token/link-based access bypasses Blitz's session-and-CASL authorization model entirely, and IDOR is the default outcome unless explicitly designed against

**What goes wrong:**
Every existing authorization check in this app (`src/lib/guard/ability.ts`) is keyed off `ctx.session.userId` and household membership rows — it assumes an authenticated Blitz session. A non-registered participant accessing their group via a personal link has *no session* in that sense (or, if a lightweight session is minted for them, it's not tied to a `User` row the CASL rules expect). If the new mutations/queries for expenses, splits, and settlements are authorized by "does a valid token exist" without also re-deriving "does *this* token's `groupId`/`memberId` match the resource being read/written," you get classic IDOR: member A's link can be used to read or edit member B's expense by guessing/incrementing an ID, because the check stopped at "is this *a* valid link" instead of "is this *the* link for *this* resource."

**Why it happens:**
The existing Guard pattern (`isMemberOfHousehold` checks scoped by `householdId` passed in the resolver input) is easy to *forget* to replicate for the new domain because the entry point is structurally different (URL token vs. session) even though the requirement — "scope every check to the specific link's grant" — is identical in spirit.

**How to avoid:**
- Every Splitting Group resolver must resolve the acting identity from the **token itself** (looked up server-side, hashed-compare, not trusted from client input) into a `{ groupId, memberId }` pair, then re-derive: "does the resource being read/written (`expenseId`, `splitId`, `settlementId`) belong to *that* `groupId`" — mirroring the existing `isTransactionPartOfHousehold` pattern in `ability.ts`, but keyed by group+link identity instead of session.
- Never accept `groupId` or `memberId` as trusted client input for authorization purposes when a token-based flow is active — derive both from the server-side token lookup, ignore/validate-only anything the client also sends.
- Write this as a CASL-integrated check if feasible (extend `Guard` with a token-derived identity resolution path) so the same authorization surface/tests apply to both session-based (organizer, who is a registered user browsing normally) and token-based (member link) access — don't build two parallel, divergent authorization systems.
- Add IDOR-specific tests: link for member A must fail (403/404, not leak existence) against member B's expense IDs, and against a different group's IDs entirely.

**Warning signs:**
- Any resolver in the group domain trusts a `groupId`/`memberId` field from the request body/query params instead of deriving it from the authenticated token.
- No test exists that tries "valid token from group X against resource from group Y."

**Phase to address:** Splitting Group domain phase — must be designed alongside the very first mutation/query, not bolted on after CRUD is "working."

---

### Pitfall 5: Token entropy, leakage via referrers/logs, and lack of rate limiting on link-based endpoints

**What goes wrong:**
Because a permanent group link *is* the credential (no password, no MFA, no session re-auth), its safety depends entirely on (a) enough entropy that it can't be guessed/brute-forced, (b) never leaking outside the URL bar, and (c) endpoints that consume it being rate-limited. This app currently has **no rate limiting anywhere** (explicitly flagged in CONCERNS.md — "No Rate Limiting... Login endpoint (brute force risk)... All RPC endpoints"). For an ephemeral password-reset token this is bad but time-bounded; for a *permanent* group-access token, an unrate-limited lookup endpoint is a standing brute-force target for as long as the group exists (which may be indefinitely, since links "keep working after the group closes"). Additionally, if the token lives in the URL path/query string (the natural, shareable-link UX this feature explicitly wants), it will land in server access logs, browser history, and — if any page the link lands on makes outbound requests (analytics, external images, link-preview fetches) — in `Referer` headers sent to third parties.

**Why it happens:**
"It's just a link, like the existing invitation email links" undersells the risk difference: invitation links expire in ~72 hours (per `inviteUser.ts`'s `tokenExpirationHours`) and are single-use-ish; group member links are permanent and reusable by design, which is a fundamentally larger attack window.

**How to avoid:**
- Use `generateToken()` from `@blitzjs/auth` (already CSPRNG-backed, consistent with the rest of the app) and confirm/document its output length is sufficient for a token with no expiry (effectively needs to resist offline/online brute force forever — favor the longer end of what the primitive supports; don't shorten it for "nicer URLs").
- Add rate limiting specifically to the link-resolution endpoint/mutation before shipping this feature — this is the one place in the app where "no rate limiting" (an existing, accepted risk for authenticated flows protected by other layers) becomes directly exploitable by an anonymous actor. Reuse Redis (already a hard dependency via BullMQ) for a simple fixed-window or token-bucket limiter keyed by IP+route.
- Ensure the link page and everything downstream of it sets `Referrer-Policy: no-referrer` (or `same-origin`) at minimum for token-bearing routes, and audit that no third-party script/pixel loads on those pages.
- Do not log the raw token server-side (only the hash, matching the existing `hashedToken` pattern) and scrub it from any error-reporting/APM breadcrumbs that might capture full URLs.
- Consider a "rotate link" action available to the organizer (ties back to Pitfall 3's revocation requirement) so a leaked link has a remediation path short of deleting the group.

**Warning signs:**
- Load testing / a simple script can hit the link-resolution mutation thousands of times per minute with no lockout.
- Full URLs (with token) show up in CI logs, error tracker breadcrumbs, or `access.log`.

**Phase to address:** Splitting Group domain phase — security must be a first-class part of the initial link/access design, not a post-launch hardening pass. Flag for `/gsd-secure-phase` retroactive verification given the CONCERNS.md history of security gaps shipping unnoticed (directory traversal, missing auth on import upload) in this codebase.

---

### Pitfall 6: Concurrent expense edits/settlements race and corrupt running balances

**What goes wrong:**
Splitting Group balances are *derived* state (sum of expense shares minus settlements, per member) rather than a single row that can be atomically updated. If two participants edit/settle concurrently — e.g., member A adds an expense while member B records a settlement, or two members edit the same expense's split simultaneously — a naive "read balance, compute new balance, write balance" pattern (or even a naive re-aggregation query executed without proper transaction isolation) can lose an update or read a stale intermediate state. This is *more* likely here than in the existing Household/Transaction domain because: (1) multiple unauthenticated participants can act concurrently on the same group via independent permanent links (no single "owner" serializing writes through one UI session), and (2) the feature explicitly wants live "who owes whom" balance display, which invites read-then-act races (e.g., "settle exactly what's currently owed" computed client-side from a possibly-stale read).

**Why it happens:**
Existing app patterns (`src/lib/model/*/mutations/*`) are written per Blitz Anti-Pattern guidance to avoid calling mutations inside mutations and to prefer batch operations, but nothing in the existing codebase currently handles concurrent-write races on aggregate/derived values — there's no prior art here to copy, and it's easy to build the "happy path" (single user, sequential edits) and never exercise concurrent access.

**How to avoid:**
- Prefer computing balances on-read (aggregate query over `Expense`/`Split`/`Settlement` rows at request time, inside a single transaction with an appropriate isolation level) rather than maintaining a persisted "running balance" column that must be incrementally kept in sync — this sidesteps most races by construction, at the cost of a heavier read query (acceptable at this feature's expected scale).
- If a persisted/cached balance is used for performance, wrap the read-modify-write in a Prisma `$transaction` with `SELECT ... FOR UPDATE` semantics (or MySQL's default `REPEATABLE READ` isolation carefully reasoned about) and add an optimistic-concurrency version/`updatedAt` check on the `Expense` row being edited so concurrent edits to the *same* expense fail loudly (409-style) instead of silently overwriting.
- For settlement recording specifically ("negative expense"), require the settlement mutation to re-fetch the current balance inside the same transaction that writes the settlement, not trust a balance value passed from the client — client-computed "amount owed" is a race-prone hint, never authoritative.
- Add a concurrency-focused integration test (using the existing Testcontainers MySQL setup) that fires two mutations for the same group/member near-simultaneously and asserts the resulting balance is consistent, not just that both requests returned 200.

**Warning signs:**
- Manual QA with two browser tabs (simulating two participants) editing the same group produces a balance that doesn't match `sum(expenses) - sum(settlements)` recomputed from scratch.
- Settlement amounts occasionally appear "wrong" only under fast back-to-back actions, not on isolated single-user testing — classic race-condition tell.

**Phase to address:** Splitting Group domain phase — balance-calculation design step; verify explicitly in that phase's UAT with a concurrent-edit scenario, not deferred to a later hardening phase.

---

### Pitfall 7: Per-expense currency with no conversion mechanism produces a nonsensical "total balance"

**What goes wrong:**
PROJECT.md already flags this as an open question: each expense/income entry has its own currency, and "no conversion mechanism exists yet in the codebase" (the existing `Household.currency` is a single fixed string per household, never aggregated across currencies). If the Splitting Group UI naively sums a member's balance across expenses recorded in EUR, USD, and GBP into one number, that number is meaningless (and actively misleading for a debt-tracking feature where trust in the number is the whole point). This is an easy trap because the *individual* per-expense split math (Pitfall 2) can be perfectly correct while the *aggregate* display is still wrong.

**Why it happens:**
Table UIs and dashboards default to "just sum the amount column" — the mistake is invisible until a real multi-currency trip/group is tested, which often isn't part of initial manual QA if the test data defaults to one currency.

**How to avoid:**
- Design the balance model to be currency-bucketed from the start: a member's balance is a *set* of `(currency, amount)` pairs, not a single number. "Who owes whom" and settlement suggestions should operate per-currency (settle the EUR debts separately from the USD debts) unless/until a conversion feature is explicitly scoped.
- Explicitly surface this in the UI (e.g., "Balance: €12.50, $8.00" rather than a single blended figure) so the constraint is a visible product decision, not a silent bug.
- If a "grand total" display is wanted later, make it an explicit, separately-scoped feature (with a defined FX-rate source and rate-as-of semantics) — do not let it sneak in as an unstated assumption of the balance/settlement data model built in this milestone.
- Confirm this data-model decision with the roadmap/requirements owner before implementation, since it affects the shape of `Split`/`Balance`/`Settlement` schemas fundamentally (per-currency rows vs. single blended row) — cheap to decide now, expensive to retrofit after data exists.

**Warning signs:**
- A "total balance" number appears anywhere in the design/mockups without a currency label.
- Settlement suggestion logic tries to net a EUR debt against a USD credit directly.

**Phase to address:** Splitting Group domain phase — schema design step, before Pitfall 2/6 work is finalized (currency-bucketing changes the shape of the balance aggregation).

---

### Pitfall 8: Cypress speed-ups quietly reduce coverage by disabling retries, dropping `after()` cleanup, or sharing test data across specs

**What goes wrong:**
The obvious levers to make this suite faster — running specs in parallel across multiple CI machines, lowering `retries.runMode` from 2, or reusing a single seeded database across specs to skip `resetAndSeedDatabase()` per test — each have a coverage/reliability cost specific to how this suite is built. Current e2e config uses **one shared Testcontainers MySQL/Redis instance for the whole run** (`TestUtilityDBContainer`, started once in `before:run`/stopped in `after:run`), with `cy.resetAndSeedDatabase()` per-spec `beforeEach` and `cy.task("resetDatabase", true)` in `after()`. Naively parallelizing specs across workers against that *same* container will cause specs to reset/seed each other's data mid-run — flaky failures that look unrelated to the actual change. Dropping `retries.runMode` (currently 2) to save time will surface Cypress's inherent auto-wait flakiness as real CI failures. Skipping `after()` cleanup to save time leaves state bleeding into the next spec file.

**Why it happens:**
"Make it faster" is usually approached by cutting whatever the profiler shows as slow (often: `resetAndSeedDatabase`, retries, or container startup), without accounting for *why* those exist — they're the mechanisms that make each spec deterministic and independent, not incidental overhead.

**How to avoid:**
- If parallelizing across workers, give each worker (or each spec file) its **own** database/schema (e.g., per-worker Testcontainers instance, or one container with per-worker schemas/databases selected via a computed `DATABASE_URL`) rather than sharing one container — this is real engineering work, not a config flag, and should be scoped explicitly.
- Profile *why* the suite is slow before cutting anything: likely candidates given this stack are (a) full app boot (`blitz start`) per CI run rather than per spec — already amortized, good; (b) `resetAndSeedDatabase()` cost per test — consider seeding only what each spec needs instead of a full reset, or truncating only touched tables; (c) `experimentalRunAllSpecs: true` combined with a cold Next.js dev/prod server on first request. Measure before optimizing.
- Move genuinely unit-testable logic (e.g., split/balance calculation, form validation) out of Cypress e2e/component tests and into Vitest unit tests, which are dramatically cheaper — this reduces total Cypress spec count without reducing coverage, since the same behavior is still tested, just at a cheaper layer. This is the highest-leverage, lowest-risk lever available and should be preferred over cutting retries/cleanup.
- Keep `retries.runMode: 2` and `after()` cleanup as non-negotiable; treat any speed-up proposal that touches them as suspect by default.
- If splitting specs across CI jobs (not full parallel workers), balance by historical spec duration (Cypress supports this via `cypress-split` or manual bucketing) rather than arbitrary alphabetical grouping, so wall-clock time actually drops.

**Warning signs:**
- Flaky failures appear only in CI, only when run alongside other specs, never locally when a spec is run in isolation — signals shared-state contamination from parallelization.
- Coverage report (`.test/lcov.info`) drops after a "performance" change with no corresponding feature removal.
- A "fast" run passes but a subsequent full/nightly run (if one exists) starts catching bugs the fast run didn't — signals retries or assertions were weakened.

**Phase to address:** Cypress performance phase — should include an explicit "coverage delta" check (compare LCOV before/after) and a repeated-run flake check (run the sped-up suite N times in CI before merging) as acceptance criteria, not just wall-clock time.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|-----------------|------------------|
| Persisting a cached `balance` column instead of computing on-read | Faster balance display for large groups | Race conditions (Pitfall 6), extra invalidation logic to keep in sync | Only after on-read aggregation is proven too slow at real scale — start on-read |
| Reusing `Token`/`TokenType` enum for group links instead of a new model | Less schema to write | Semantic/security coupling with unrelated auth flows (Pitfall 3) | Never for this feature — the "permanent, unauthenticated" requirement is too different from existing token semantics |
| Blended single-currency "total balance" as a stopgap UI | Simpler UI, faster to ship | Misleading/wrong numbers users may act on (settle wrong amounts) | Never — even a placeholder should be per-currency, not summed |
| Cutting Cypress `retries.runMode` to speed up CI | Immediate, easy wall-clock win | Real regressions surface as CI failures under load; team starts distrusting/ignoring red CI | Never as a primary lever — only as a last resort after profiling and moving logic to Vitest |
| Skipping the Prisma 7 spike and doing an in-place `yarn upgrade` | Feels faster to start | High risk of a half-migrated state (some files on new import paths, some not) blocking all other work mid-migration | Never — spike first given the `enhancePrisma` + 88-file import-path unknowns |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|-----------------|-------------------|
| Blitz.js `enhancePrisma` + Prisma 7 | Assuming it "just works" after `yarn upgrade prisma @prisma/client` since Blitz.js hasn't shipped an update targeting Prisma 7's architecture | Spike-test `enhancePrisma(PrismaClient)` against a real Prisma 7 client (with driver adapter) before committing to the migration; have a fallback plan (e.g., wrap errors manually) if it's broken |
| `@blitzjs/auth` token primitives (`generateToken`, `hash256`) for group links | Building a bespoke token generator "because it's a different use case" | Reuse the existing, already-reviewed primitives; only the *storage model* (Pitfall 3) needs to be new, not the crypto |
| Testcontainers MySQL/Redis in Cypress `setupNodeEvents` | Assuming containers are cheap to spin up per-worker without checking CI runner resource limits | Confirm CI runner CPU/memory headroom before adding multiple parallel Testcontainers instances; a resource-starved parallel run can be slower and flakier than sequential |
| MySQL `DECIMAL`/`Decimal` type via Prisma | Treating `Decimal` as a drop-in for `Float` without updating serialization (Prisma `Decimal` doesn't `JSON.stringify` as a plain number by default) | Explicitly decide the serialization boundary (e.g., convert to integer cents or string at the RPC boundary) for any new money field so client code gets predictable types |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|-----------------|
| On-read balance aggregation without indexes on the new `Expense`/`Split` tables | Group balance page slows as expense count grows | Add indexes on `groupId`, `memberId`, foreign keys up front — this repo's CONCERNS.md already documents "Missing Database Indexes" as a repeat pattern; don't repeat it in the new schema | Noticeable above a few hundred expenses per group without indexes |
| Eager-loading all relations on group/expense queries (mirrors existing `getTransactions` N+1/over-fetch pattern flagged in CONCERNS.md) | Slow group detail page as members/expenses grow | Use `select` over `include`, and split list vs. detail query shapes from the start for the new domain, rather than inheriting the existing over-fetch pattern | Scales worse than the household case since group links may be accessed by many more anonymous, less-trusted, higher-frequency requests |
| Shared single Testcontainers instance under attempted Cypress parallelism | Cross-spec data contamination, intermittent CI flakes | Isolate DB per worker if parallelizing (see Pitfall 8) | Immediately upon adding parallel workers without this change |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Authorizing group resolvers by "token is valid" alone, without re-scoping to the specific resource's `groupId` | IDOR — one member's link reads/edits another member's or another group's data | Always derive `groupId`/`memberId` server-side from the token and re-check resource ownership per Pitfall 4 |
| No rate limiting on the token-resolution endpoint | Brute-forceable permanent credential (this app has zero rate limiting anywhere today, per CONCERNS.md) | Add Redis-backed rate limiting specifically for this new anonymous-access surface before launch |
| Token appearing in URLs without `Referrer-Policy` | Token leakage to third parties via outbound requests from the link landing page | Set strict referrer policy on token-bearing routes; audit for any third-party resource loads on those pages |
| Trusting client-supplied "amount owed" when recording a settlement | Debt amounts can be manipulated by a malicious/buggy client to record incorrect settlements | Recompute the authoritative balance server-side, inside the same transaction, never trust client-sent settlement amounts |
| No audit trail for group expense mutations (mirrors existing "No Audit Logging" gap in CONCERNS.md) | Anonymous, permanent-link participants can add/edit/delete expenses with no record of who (which link/member) did what, complicating dispute resolution | Log at minimum `memberId` (or token identity) + action + timestamp for group mutations, even if a full audit-log system isn't built for the rest of the app this milestone |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-------------------|
| Single blended "total balance" across currencies | Users see a number that doesn't correspond to anything they can actually settle | Show per-currency balances explicitly (Pitfall 7) |
| Settlement math computed client-side and only confirmed after submit | User sees a settlement amount that's already stale by the time they submit (another member added an expense in between) | Recompute and re-display "amount to settle" server-side at confirmation time, not just at initial page load |
| Permanent link with no visible indication of what it grants before use | Non-registered participants may not realize the link gives them full add/edit/delete/settle access (per the PROJECT.md decision) — surprising if shared carelessly | Show a clear consent/context screen ("This link lets you add expenses and view/settle balances for group X") before granting access |

## "Looks Done But Isn't" Checklist

- [ ] **Splitting Group balances:** Often missing a currency dimension — verify every balance/settlement figure in the UI is unambiguously tied to one currency, never summed across currencies.
- [ ] **Splitting Group split math:** Often missing remainder handling — verify `sum(participant shares) === expense.amount` holds for odd amounts/participant counts (e.g., splitting 10.01 three ways), not just "round" test amounts.
- [ ] **Group member links:** Often missing revocation — verify there's a way to deactivate a specific member's link without deleting the group or affecting other members' links.
- [ ] **Group authorization:** Often missing cross-group IDOR checks — verify a valid link from Group A is explicitly rejected against Group B's resources, not just "works for A."
- [ ] **Prisma 7 migration:** Often missing a full sweep — verify `grep -r "@prisma/client"` returns zero raw imports outside the intended barrel/generated-path files after migration, and that `enhancePrisma` still correctly maps Prisma errors (test: trigger a unique-constraint violation and confirm the expected Blitz error shape).
- [ ] **Cypress performance work:** Often missing a coverage regression check — verify LCOV coverage percentage after the change is equal or higher than before, and re-run the full suite 3-5x in CI to confirm no new flake was introduced.
- [ ] **Concurrent settlement handling:** Often missing until explicitly tested — verify with a two-actor concurrent test (two links acting on the same group near-simultaneously) that balances stay consistent, not just single-actor manual QA.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|-----------------|-----------------|
| Prisma 7 migration partially breaks `enhancePrisma`/import paths mid-merge | MEDIUM | Isolate the migration to its own branch/phase with a hard go/no-go gate before merging (per spike recommendation above); if broken post-merge, the barrel re-export pattern (Pitfall 1) makes a path-level rollback mechanical rather than a 88-file hand-revert |
| Float-based split amounts already shipped and in production data | HIGH | Requires a data migration (recompute integer-cents equivalents, reconcile any drift against the original expense totals) plus a schema change — strongly prefer preventing this (Pitfall 2) over recovering from it |
| Reused `Token` model causes an auth-flow regression (e.g., password reset breaks because of an unexpected `TokenType`) | MEDIUM | Isolate the new token type behind its own model per Pitfall 3 from the start; if already coupled, splitting the model out later requires a careful data migration but is mechanically straightforward since `Token` rows are not deeply relational |
| IDOR discovered post-launch in group resolvers | HIGH (trust/security incident) | Rotate all affected group member links immediately (requires the revocation mechanism from Pitfall 3 to exist), patch the authorization check, and treat as a security incident per the existing CONCERNS.md pattern of unresolved findings — don't let this become another item on that list |
| Cypress speed-up introduces flake/coverage loss discovered late | LOW-MEDIUM | Revert the specific speed lever (retries, cleanup) that was cut; the LCOV-diff check in the "Looks Done But Isn't" list is designed to catch this before merge, so late discovery signals that check was skipped |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|-------------------|----------------|
| Prisma 7 breaks `enhancePrisma`/import paths (P1) | Prisma migration phase | Spike branch proves `enhancePrisma` + driver adapter works before full migration starts; post-migration `grep` sweep for stray `@prisma/client` imports |
| Float amounts in split math (P2) | Splitting Group phase — schema design | Unit test asserting `sum(shares) === amount` across a matrix of amounts/participant counts |
| Token model misuse for permanent links (P3) | Splitting Group phase — schema design | Code review checklist: confirm a dedicated model exists, not an extended `TokenType` enum |
| IDOR via token-based access (P4) | Splitting Group phase — first resolver built | Test suite includes cross-group/cross-member token-misuse cases, reviewed via `/gsd-secure-phase` |
| Token entropy/leakage/rate limiting (P5) | Splitting Group phase — access design | Rate-limit test (burst requests against link-resolution endpoint return 429s); referrer-policy header present on token routes |
| Concurrent balance races (P6) | Splitting Group phase — balance calculation design | Concurrent-actor integration test using existing Testcontainers setup |
| Multi-currency balance aggregation (P7) | Splitting Group phase — schema design (before P2/P6 finalized) | Design review confirms balance model is currency-bucketed, not a single blended number |
| Cypress speed-ups reducing coverage (P8) | Cypress performance phase | LCOV coverage diff check + repeated-run flake check as merge gate |

## Sources

- Direct codebase inspection (HIGH confidence): `src/lib/db/schema/transaction.prisma`, `src/lib/db/schema/user.prisma`, `src/lib/db/schema/household.prisma`, `src/lib/db/index.ts`, `src/lib/guard/ability.ts`, `src/lib/model/auth/mutations/inviteUser.ts`, `next.config.ts`, `cypress.config.ts`, `.github/workflows/ci.yml`, `.planning/codebase/CONCERNS.md`, `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/TESTING.md`, `.planning/PROJECT.md`.
- Prisma ORM 7 breaking changes (MEDIUM confidence — verified via two independent web searches, cross-checked against Prisma's own upgrade guide and a GitHub issue on Webpack bundling): [Upgrade to Prisma ORM 7 | Prisma Documentation](https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7), [Prisma v6 → v7 migration guide (Rust-free, driver adapters, prisma-client generator)](https://tomodahinata.com/en/blog/prisma-orm-v6-to-v7-migration-guide), [Prisma Client 7 generated code breaks when bundling with Webpack — prisma/prisma#28627](https://github.com/prisma/prisma/issues/28627), [Breaking changes with mysql adapter for prisma 7 — prisma/prisma#28665](https://github.com/prisma/prisma/issues/28665).
- General debt-splitting/token-security reasoning is derived from applying this codebase's own established patterns (household isolation, CASL authorization, existing token model) to the new requirements in PROJECT.md, not from an external Splitwise-clone post-mortem — no such source was found or needed given the strength of first-party evidence.

---
*Pitfalls research for: Financer v1.1.0 milestone (bug fixes, Prisma 7 migration, Cypress performance, Splitting Group domain)*
*Researched: 2026-08-21*
