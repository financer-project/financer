# Architecture Research

**Domain:** Splitting Groups (Splitwise-style shared expenses) added to an existing Blitz.js/Next.js/Prisma/MySQL household finance app, plus a Prisma 6→7 migration and two bug fixes
**Researched:** 2026-08-21
**Confidence:** HIGH (architecture patterns — derived directly from the actual codebase); LOW (Prisma 7 breaking-change specifics — single web source, not verified against this repo's exact dependency tree; flag for dedicated research at migration time)

## Standard Architecture

### System Overview

```text
┌────────────────────────────────────────────────────────────────────────────┐
│                         Client Layer (React / Next.js)                     │
│  Household app: src/app/(internal)/*        Group app: src/app/(group)/*   │
│  (session-gated, sidebar shell)              (token-gated, no sidebar)     │
└───────────────────────┬──────────────────────────────┬─────────────────────┘
                         │ RPC (session)                │ RPC (token param)
                         ▼                              ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                  Business Logic Layer (Blitz RPC, per domain)              │
│  src/lib/model/household/*   src/lib/model/transactions/*  (existing)      │
│  src/lib/model/splittingGroup/{queries,mutations,services}/*  (NEW)        │
│  ├─ resolver.zod()            — input validation (both paths)             │
│  ├─ resolver.authorize()      — session gate (household/user domains only)│
│  ├─ resolveGroupToken()       — NEW: token gate for group member RPCs     │
│  └─ Guard.authorizePipe()     — CASL, household-role checks (unchanged)   │
└───────────────────────┬──────────────────────────────┬─────────────────────┘
                         │                              │
                         ▼                              ▼
┌────────────────────────────────────────────────────────────────────────────┐
│               Data Access Layer (Prisma ORM → MySQL)                       │
│  Household/Account/Transaction models (existing, untouched)                │
│  SplittingGroup / SplittingGroupMember / SplittingGroupExpense /            │
│  SplittingGroupExpenseSplit  (NEW — separate models, zero FK to Household)  │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│              Infrastructure & Cross-Cutting (unchanged)                    │
│   Jobs (BullMQ+Redis) | Mailers | Guard (CASL) | Utilities                 │
└────────────────────────────────────────────────────────────────────────────┘
```

The Groups domain is a **new, parallel bounded context** — it does not sit "inside" the Household domain and does not extend `Guard`/CASL. It gets its own authorization primitive (personal-link token) because its access model is fundamentally different (no login required).

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Group pages (new route group) | Render group dashboard, expense list/entry, balances, settle-up — for both organizer (logged-in) and link-based members | `src/app/g/[token]/*` or `src/app/(group)/g/[token]/*` — new Next.js route segment, outside `(internal)` and `(auth)` |
| Group RPC resolvers | Read/write group expenses, members, settlements | `src/lib/model/splittingGroup/{queries,mutations}/*` — new domain folder, same `resolver.pipe()` convention as every other domain |
| Token resolution middleware | Turn an opaque link token into `{ groupId, memberId }` and reject invalid/revoked tokens | New shared helper (e.g. `src/lib/model/splittingGroup/lib/resolveMemberToken.ts`), used as a `resolver.pipe()` step in place of `resolver.authorize()` |
| SplittingGroup Prisma models | Own the group/member/expense/split data — fully disjoint from Household/Account/Transaction/Category | `src/lib/db/schema/splittingGroup.prisma` (new file, follows existing one-file-per-domain convention) |
| Household Guard (`ability.ts`) | Unchanged — continues to authorize Household/Account/Transaction/etc. Not touched for Groups. | `src/lib/guard/ability.ts` |
| Group balance computation | Derive each member's running balance from expenses + splits at read time | New service, `src/lib/model/splittingGroup/services/computeBalances.ts` |

## Recommended Project Structure

```
src/
├── app/
│   ├── (internal)/                  # existing — household app, session-gated, unchanged
│   ├── (auth)/                      # existing — login/signup, unchanged
│   ├── g/[token]/                   # NEW — public entry point for group links
│   │   ├── page.tsx                 # group dashboard for the member behind this token
│   │   ├── expenses/                # add/edit/delete own expenses, view all
│   │   ├── balances/                # per-member running balances, settle-up UI
│   │   └── layout.tsx               # NO BlitzLayout/session redirect — reads token from URL, invokes RPC with it
│   └── (internal)/groups/           # organizer-side management UI (create/close group, manage members) — session-gated, lives in the existing authenticated shell
├── lib/
│   ├── db/schema/
│   │   └── splittingGroup.prisma    # NEW — SplittingGroup, SplittingGroupMember, SplittingGroupExpense, SplittingGroupExpenseSplit
│   ├── model/
│   │   └── splittingGroup/          # NEW bounded context, same shape as every existing domain
│   │       ├── mutations/           # createGroup, addGroupMember, createGroupExpense, settleGroupDebt, closeGroup, ...
│   │       ├── queries/             # getGroup, getGroupExpenses, getGroupBalances, ...
│   │       ├── services/            # computeBalances.ts, groupTokenService.ts (generate/hash/lookup)
│   │       └── schemas.ts           # Zod schemas, incl. a shared `GroupTokenSchema` for token-path mutations
│   └── guard/
│       └── ability.ts               # untouched — Groups does not use CASL/household roles
```

### Structure Rationale

- **`src/app/g/[token]/`** is a new top-level route segment, deliberately outside `(internal)` (which force-redirects to `/login` and requires a household) and outside `(auth)`. It needs its own minimal layout with no session check.
- **`src/app/(internal)/groups/`** hosts the *organizer's* view (create group, manage members, see the invite links) — this is session-gated like the rest of the app, since only registered users organize groups.
- **`src/lib/model/splittingGroup/`** mirrors the existing per-domain folder convention (`mutations/`, `queries/`, `services/`, `schemas.ts`) exactly as `transactions/`, `household/`, etc. do — no new architectural idiom introduced, just a new domain folder.
- **`src/lib/db/schema/splittingGroup.prisma`** is one new schema file, per the existing "one `.prisma` file per domain" convention — it has **zero foreign keys into `household.prisma`/`account.prisma`/`transaction.prisma`**, only an optional `User` relation on organizer/member for registered participants. This directly satisfies the locked "fully separate domain" and "no shared accounts/categories" decisions.

## Architectural Patterns

### Pattern 1: Session-gated resolver vs. token-gated resolver (same `resolver.pipe()` shape)

**What:** Every existing mutation/query in this codebase uses `resolver.pipe(zod, authorize, guardCheck, logic)`. Notably, `resolver.authorize()` is an **explicit, opt-in** step — resolvers that omit it are already reachable without a session (this is the existing pattern used by `forgotPassword`, which has no `resolver.authorize()` call at all). Group-member RPCs (called from the token-link pages) follow the same shape but swap `resolver.authorize()` for a new pipe step that validates the token and injects `{ groupId, memberId }` into context/input instead of relying on `ctx.session`.

**When to use:** Any query/mutation invoked from `src/app/g/[token]/*` pages (non-registered or registered members acting via their personal link).

**Trade-offs:** Keeps the RPC layer conceptually uniform (still `resolver.pipe()`, still Zod-validated) but means CASL/`Guard` is *not* the enforcement mechanism here — authorization is "does this token map to a member of this group," which is coarser (Splitwise-style: link = full participant access, one tier, no roles). This matches the locked product decision exactly, so no extra role modeling is needed for v1.

**Example:**
```typescript
// src/lib/model/splittingGroup/mutations/createGroupExpense.ts
export default resolver.pipe(
    resolver.zod(CreateGroupExpenseSchema.extend({ token: z.string() })),
    async ({ token, ...input }) => {
        const member = await resolveMemberToken(token) // throws AuthenticationError if invalid
        return { member, ...input }
    },
    async ({ member, ...expense }) => db.splittingGroupExpense.create({ data: { ...expense, groupId: member.groupId, createdByMemberId: member.id } })
)
```

### Pattern 2: Permanent, member-scoped access token — NOT the existing `Token` model

**What:** The codebase already has a `Token` model (`generateToken()`/`hash256()` from `@blitzjs/auth`, used for password-reset and household-invitation emails). It does not fit this use case: `Token.userId` is **required** (non-null) and `Token.expiresAt` is **required** — but group member links must work for **non-registered users** (no `userId`) and must be **permanent** (no expiry, keeps working after the group closes). Reuse the *generation mechanism* (`generateToken()`/`hash256()`), not the `Token` model itself. Store a `hashedToken` (unique) directly on `SplittingGroupMember`.

**When to use:** Whenever a group member (organizer included, for consistency) needs their personal link.

**Trade-offs:** A dedicated field avoids overloading the generic `Token` model's semantics (which is "short-lived, single-purpose, tied to a user") and avoids a schema change (nullable `userId`/`expiresAt`) to a model several other flows depend on. Costs one extra unique-indexed column on `SplittingGroupMember` instead of a join — acceptable given the model is small and always looked up by token first.

**Example:**
```prisma
model SplittingGroupMember {
    id          String   @id @default(uuid())
    displayName String                     // shown even for non-registered participants
    hashedToken String   @unique            // permanent personal link secret, never expires
    user        User?    @relation(fields: [userId], references: [id]) // null for non-registered members
    userId      String?
    group       SplittingGroup @relation(fields: [groupId], references: [id], onDelete: Cascade)
    groupId     String
}
```

### Pattern 3: Computed (not stored) running balances

**What:** The existing codebase has no event-sourcing and no cached/denormalized balance fields anywhere (`Account` balance, where it exists in the UI, is derived from summed `Transaction.amount` rows, not stored). Follow the same rule for Groups: a member's running balance = sum of (amounts they paid) − sum of (their split shares owed), computed in a query/service at read time from `SplittingGroupExpense` + `SplittingGroupExpenseSplit`, not persisted as a running total on `SplittingGroupMember`.

**When to use:** `getGroupBalances` query, and any UI showing "who owes whom."

**Trade-offs:** Avoids a whole class of drift bugs (stored balance out of sync with expense edits/deletes) at the cost of an aggregation query on every balance view — acceptable at expected group sizes (a handful of members, at most low hundreds of expenses per group). Debt settlement is modeled as a normal `SplittingGroupExpense` row with a settlement flag/type (a "negative expense" per the locked decision), so it flows through the same computation with no special-cased ledger logic.

## Data Flow

### Request Flow — Organizer / registered-user path (existing session auth, unchanged)

```
Organizer browser (logged in)
    ↓
src/app/(internal)/groups/*  →  resolver.pipe(zod, resolver.authorize(), logic)
    ↓                                      ↓
[creates SplittingGroup, generates each   ctx.session.userId used for `organizerId`
 member's hashedToken, sends invite links]
    ↓
Prisma → MySQL (SplittingGroup, SplittingGroupMember rows)
```

### Request Flow — Member link path (NEW — no session, token-based)

```
Member opens personal link  →  GET /g/[token]
    ↓
src/app/g/[token]/layout.tsx  (no BlitzLayout, no login redirect)
    ↓ passes token as an RPC input param (not via session)
src/lib/model/splittingGroup/{queries,mutations}/*
    ↓
resolveMemberToken(token)                          ← replaces resolver.authorize()
    - db.splittingGroupMember.findUnique({ where: { hashedToken } })
    - throw AuthenticationError if not found (do NOT leak group/member existence)
    - inject { groupId, memberId } into the pipe
    ↓
Business logic (create/edit/delete own expense, read all expenses, read balances,
record a settlement) — scoped to member.groupId, never to a Household
    ↓
Prisma → MySQL (SplittingGroup* models only — zero reads/writes to Household/Account/Transaction)
```

**Key contrast with the existing session model:** every existing protected resolver reads identity from `ctx.session` (set by Blitz's cookie-based session middleware) and then checks Household membership via `Guard`. The group-link path has **no cookie session at all** for non-registered members — identity is entirely carried by the opaque token in the URL/RPC payload, verified by a straight `hashedToken` lookup, and authorization is binary (valid token for this group's member → full participant access) rather than role-graded. This is the one genuinely new access-control primitive this milestone introduces; everything else (resolver.pipe, Zod schemas, Prisma domain modularization) is the established pattern reused as-is.

**Token security notes carried over from existing conventions:** hash the token at rest exactly like `Token.hashedToken` (`hash256()`), never store or log the raw token server-side after creation, generate with `generateToken()` (same crypto-strength source already vetted for password-reset), and treat "member not found for token" and "token malformed" identically (generic `AuthenticationError`, no distinguishing response) to avoid link enumeration.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Typical usage (households + a handful of groups per user, dozens of members/expenses per group) | Current design is fine as-is: computed balances, no caching layer, single MySQL instance — matches existing app's scale assumptions (self-hosted, small-household tool) |
| Many groups / large expense history per group | Add indexes on `SplittingGroupExpense.groupId` and `SplittingGroupExpenseSplit.expenseId`/`memberId`; balance computation stays a single aggregated query (Prisma `groupBy`/raw SQL) rather than N+1 per member — same anti-pattern discipline already enforced elsewhere in this codebase |
| High-traffic public group links (viral sharing) | Not a realistic concern for this self-hosted app; if it ever became one, token lookup is already O(1) via a unique index, so no architectural change needed |

### Scaling Priorities

1. **First (and only realistic) bottleneck:** balance computation doing per-member queries in a loop instead of one aggregated query — mitigate by writing `getGroupBalances` as a single `groupBy`/raw aggregation from day one (same "no N+1 in loops" anti-pattern already documented for this codebase's import processor).
2. Nothing else is expected to matter at this app's scale.

## Anti-Patterns

### Anti-Pattern 1: Reusing `Guard`/CASL for group-link access

**What people do:** Try to shoehorn the token-link member into `ctx.session` (e.g., synthesize a fake session) so the existing `Guard.authorizePipe()` machinery "just works."
**Why it's wrong:** `Guard` is built entirely around `ctx.session.userId` + Household-role hierarchy; faking a session for a non-registered, tokenless-login user is fragile, conflates two different security models, and risks accidentally granting Household-scoped abilities to a Group-only token. It also violates the locked decision that Groups must stay fully separate from the Household security model.
**Do this instead:** A dedicated, deliberately simpler token-resolution step (Pattern 1 above) that never touches `ctx.session` or `Guard`, and Group resolvers that never call `Guard.authorizePipe()`.

### Anti-Pattern 2: Reusing the generic `Token` model for personal group links

**What people do:** Add a group link by creating a `Token` row (`type: GROUP_INVITE` or similar), since the app already has token infrastructure.
**Why it's wrong:** `Token.userId` and `Token.expiresAt` are both required — forcing either a schema loosening that affects password-reset/household-invitation flows, or a hacky expiresAt-in-year-9999 workaround. It also mixes a "single-use, short-lived, email-delivered" concept with a "permanent, per-member, URL-carried" concept.
**Do this instead:** Store `hashedToken` directly on `SplittingGroupMember` (Pattern 2 above); reuse only the `generateToken()`/`hash256()` utility functions, not the `Token` table.

### Anti-Pattern 3: Storing a running balance field instead of computing it

**What people do:** Add `SplittingGroupMember.balance Float` and increment/decrement it on every expense create/update/delete.
**Why it's wrong:** No event sourcing exists in this codebase; any missed update path (bulk delete, failed transaction, future edit feature) silently desyncs the stored balance from reality — exactly the class of bug the existing architecture avoids by computing everything from `Transaction` rows.
**Do this instead:** Compute balances from `SplittingGroupExpense`/`SplittingGroupExpenseSplit` in a query/service (Pattern 3 above).

### Anti-Pattern 4: Doing the Prisma v7 migration and the new domain in the same pass

**What people do:** Add the new `splittingGroup.prisma` models and flip the `client` generator/imports to Prisma v7 in one combined change, to "only touch things once."
**Why it's wrong:** Prisma 7 is a wide, mechanical breaking change — it removes the Rust query engine, requires a mandatory driver adapter, changes the generator to `prisma-client` with a required custom `output` path (so **every** `import { X } from "@prisma/client"` across the whole codebase — `ability.ts`, every domain's `schemas.ts`, `db/index.ts`, etc. — needs updating to the new generated path), moves config into `prisma.config.ts`, and removes `$use` middleware. Bundling that repo-wide mechanical churn with new, still-settling domain code makes it hard to tell whether a bug came from the migration or the new feature, and doubles the surface area of any one regression. *(Confidence: LOW — based on a single external source, not verified against this repo's exact Blitz/`enhancePrisma` interaction; treat as a strong signal to scope a dedicated migration phase, and re-verify specifics before executing it — `enhancePrisma()` from `blitz` wraps the `PrismaClient` constructor directly (`src/lib/db/index.ts`), and its compatibility with the v7 driver-adapter constructor signature is unconfirmed.)*
**Do this instead:** Migrate Prisma to v7 as its own isolated phase first (touches only existing models/imports, full regression suite as the safety net), then build the Splitting Groups domain against the already-stabilized v7 client and its new import conventions from the start.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| MySQL (via Prisma) | New `splittingGroup.prisma` schema file, same `db:generate`/`migrate` workflow | No new infra; just new tables |
| Mailers (Nodemailer) | Reuse existing `src/lib/mailers/*` pattern to send each member their personal link on group creation/member add | Same `xMailer({...}).send()` convention as `invitationMailer`/`notificationMailer` |
| Redis/BullMQ | Not required for v1 of Groups (no async processing implied by the locked scope) | Revisit only if reminders/notifications for settlements are added later |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Groups domain ↔ Household domain | **None by design** — no shared Prisma relations, no shared queries/mutations, no shared Guard rules | Enforces the locked "fully separate domain" decision; the only shared concept is `User` (an organizer/registered member is the same `User` row as elsewhere in the app), via an optional FK |
| Groups domain ↔ Auth/session | Organizer-side pages/mutations use the existing session (`resolver.authorize()`); member-link pages/mutations use the new token pipe instead | Two parallel entry points into the same domain's resolvers is acceptable here only because the link path is intentionally read/write-limited to "your own expenses + shared read access," matching the single-tier access decision |
| Groups domain ↔ Bug fixes (#78 counterparty filter, #76 tab navigation) | None — both bugs live entirely in `transactions/` (queries) and shared form components (`src/lib/components/common`/`ui`) respectively | Safe to fix independently and in any order relative to Groups/Prisma work; doing them first gives a clean, fast-passing regression baseline before the riskier Prisma v7 migration |

## Suggested Build Order (for roadmap phase sequencing)

1. **Bug fixes first** (`#78` counterparty filter error, `#76` tab-key navigation, and — if bundled — `#71` Cypress perf): small, isolated, touch only `transactions/` queries and shared form/select/date components. No dependency on Prisma version or the new domain. Fixing and (ideally) speeding up the E2E suite here establishes a clean, trustworthy regression baseline *before* the riskier changes below.
2. **Prisma 6→7 migration next, in isolation**: mechanical, codebase-wide (generator/import-path change touches every domain's `schemas.ts`, `ability.ts`, `db/index.ts`), high blast-radius, best verified against the existing test suite with zero new-feature code in flight at the same time. Confirm `enhancePrisma()`/driver-adapter compatibility here, not mid-feature.
3. **Splitting Groups domain last**: new bounded context, built from day one against the already-upgraded Prisma client (correct v7 import paths/generator conventions), covering: schema (`splittingGroup.prisma`) → organizer mutations (create group, add/manage members, generate links) → member-token resolution pipe → expense/split mutations & queries → balance computation service → settlement-as-negative-expense → group-link UI (`src/app/g/[token]/*`) → organizer UI (`src/app/(internal)/groups/*`).

**Why this order and not Groups-first or interleaved:** Building Groups before the Prisma migration means writing brand-new models/imports against v6 conventions, then touching all of that new code again during the v7 migration — doubling the churn on the least-proven code. Building Groups *during* the migration makes it impossible to tell which of the two efforts caused any given regression. Bug fixes are independent of both and cheapest to land first, so there's no reason to sequence them anywhere but first.

## Sources

- Direct codebase inspection (HIGH confidence — primary source, this repository): `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STRUCTURE.md`, `src/lib/guard/ability.ts`, `src/lib/db/schema/{household,user,transaction,schema}.prisma`, `src/lib/model/transactions/mutations/createTransaction.ts`, `src/lib/model/household/mutations/addOrInviteHouseholdMember.ts`, `src/lib/model/auth/mutations/forgotPassword.ts`, `src/lib/db/index.ts`, `src/app/(internal)/layout.tsx`, `package.json`
- [Upgrade to Prisma ORM 7 | Prisma Documentation](https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7) — LOW confidence per this session's tooling (single web-search-derived source, not cross-checked); re-verify against the official guide directly before executing the migration phase
- [Prisma 7 Migration Playbook: Typed SQL, Rust Deprecation](https://www.digitalapplied.com/blog/prisma-7-migration-playbook-from-6-typed-sql-rust-deprecation) — LOW confidence, same caveat

---
*Architecture research for: Financer Splitting Group domain (v1.1.0 milestone)*
*Researched: 2026-08-21*
