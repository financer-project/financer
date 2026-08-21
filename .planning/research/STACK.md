# Stack Research

**Domain:** Personal finance app (Next.js/Blitz.js/Prisma/MySQL) — subsequent milestone: Prisma v7 upgrade, Cypress E2E performance, Splitwise-style "Splitting Group" feature
**Researched:** 2026-08-21
**Confidence:** MEDIUM-HIGH (Prisma v7 facts verified against official docs + npm registry; Cypress/feature-library findings verified against multiple independent sources; some forward-looking claims are LOW confidence and flagged as such)

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `prisma` | 7.9.1 | Schema/migration CLI | Explicit milestone goal. Latest stable as of research date (released well past the 7.0.0 GA); pulls in all post-GA fixes (connection-pool tuning, mariadb-adapter bugfixes) instead of pinning to day-one 7.0.0. |
| `@prisma/client` | 7.9.1 | Generated query client | Must match `prisma` CLI version exactly (Prisma enforces this at generate time). |
| `@prisma/adapter-mariadb` | 7.9.1 | Driver adapter for MySQL | Prisma 7 made the Rust-free client the default and **requires an explicit driver adapter for every provider** — there is no more bundled Rust query engine. For MySQL/MariaDB, Prisma's own docs recommend `@prisma/adapter-mariadb` (built on the `mariadb` npm driver) over the older `@prisma/adapter-mysql2`; it's the one actively documented and maintained for the MySQL provider going forward. |
| `mariadb` | 3.5.3 | Node MySQL driver (peer dep of the adapter) | Required peer dependency of `@prisma/adapter-mariadb`. Connection-pool behavior (pool size, timeouts) now comes from **this** driver's options, not Prisma's old defaults — pool config that lived implicitly in Prisma v6 needs to be made explicit here. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `prisma-mock` | 1.1.0 (was 0.10.3) | Unit-test Prisma client mocking (Vitest) | **Must be upgraded alongside Prisma 7**, not left on 0.10.3. Its peer-dependency range (`^7.0.0`) confirms v7 support, but v1.x changed its API: use the `prisma-mock/client` entry point (pass the generated Prisma namespace explicitly) instead of the legacy import — the old 0.10.x API is only kept as `prisma-mock/legacy` for backward compat. This is a required code change at every existing resolver unit test, not just a version bump. |
| `cypress-split` | 1.25.0 | Splits Cypress spec files across parallel CI machines by count/weight, without Cypress Cloud | The project's CI (`.github/workflows/ci.yml`) runs all E2E specs sequentially on a single `ubuntu-latest` runner with no Cypress Cloud recording key configured. `cypress-split` reads `SPLIT`/`SPLIT_INDEX` env vars and lets a GitHub Actions matrix (e.g. 3-4 shards) divide the spec list — this is the direct, low-risk fix for "Cypress E2E suite is slow" that doesn't require paying for Cypress Cloud or rewriting the test framework. |
| `node:crypto` (built-in) | Node 22 | Generate the permanent per-member access token for Splitting Group links | Use `crypto.randomBytes(32).toString("base64url")` (43 URL-safe chars, 256 bits of entropy) to mint each member's personal link token. **No new dependency needed** — Node's built-in `crypto` module is already sufficient and already used implicitly via `secure-password`/Blitz session internals. Store only a SHA-256 hash of the token in the DB (not the raw token) so a DB dump doesn't hand out working access links directly; the raw token is shown to the user once and encoded in the link URL. |
| `currency-codes` | 2.2.0 (existing) | Validate/lookup ISO 4217 currency codes for the per-expense currency field | Already a dependency — reuse it as-is for the Splitting Group expense/income currency picker and Zod validation. No replacement needed. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Cypress `video: false` for `e2e` (config change, not a new dependency) | Stop encoding a video for every spec run | The current `cypress.config.ts` does not set `video`, so it defaults to `true`. Video encoding is one of the largest fixed per-spec costs in Cypress runs, especially combined with `experimentalRunAllSpecs: true`. Screenshots-on-failure (`Upload screenshots` CI step) already cover the debugging need this milestone's issue #71 is about — turn video off for `runMode` (keep for `open`/manual debugging if desired) as part of the perf work, no library needed. |
| Cypress `numTestsKeptInMemory` / retries tuning | Reduce memory pressure and wasted retry time in long specs | `retries.runMode: 2` is already set (good — reduces CI flake reruns to the whole suite instead of ad hoc). Combine with spec splitting above rather than raising retries further. |
| GitHub Actions matrix (`strategy.matrix`) | Run split Cypress shards in parallel | No new package — this is a `ci.yml` change to turn the current single sequential `Run E2E Tests` step into `N` parallel jobs, each running one `cypress-split` shard against its own `testcontainers`-backed MySQL/Redis (already containerized per test run via `TestUtilityDBContainer`). |

## Installation

```bash
# Prisma v7 (core + adapter)
yarn add prisma@7.9.1 @prisma/client@7.9.1 @prisma/adapter-mariadb@7.9.1 mariadb@3.5.3

# Test infra
yarn add -D prisma-mock@1.1.0 cypress-split@1.25.0

# No new runtime dependency for token generation (node:crypto is built-in)
# No new dependency for currency (currency-codes already installed)
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|--------------------------|
| `@prisma/adapter-mariadb` | `@prisma/adapter-mysql2` (mysql2-based) | Only if the team specifically wants to keep using the `mysql2` driver ecosystem (e.g. for a `mysql2`-specific feature or existing tooling elsewhere in the stack). Prisma's own MySQL docs point to `mariadb` as the primary-documented adapter for the MySQL provider in v7; `adapter-mysql2` exists but has thinner official documentation post-GA. Not worth the divergence here. |
| `node:crypto` for tokens | `nanoid` 6.0.1 | If the team wants shorter, more "shareable" looking URLs (21 chars vs. 43) and is fine adding a tiny dependency. Nanoid uses `crypto.randomBytes` under the hood in Node, so it is not "more secure" than the built-in approach — it's a UX/length tradeoff, not a security one. Given CLAUDE.md's "don't add dependencies you don't need" instruction, default to built-in `crypto`. |
| Hand-rolled greedy debt-simplification (in `src/lib/model/splittingGroup/...`) | `splitwise-js-map` npm package | Do not use `splitwise-js-map`: low download counts, no recent maintenance activity found, and the algorithm itself (greedy match of max-creditor/max-debtor, O(n log n) per round) is ~30-50 lines of TypeScript. Debt simplification is provably NP-hard for the *true minimum* transaction count, but the same greedy heuristic Splitwise itself uses (repeatedly settle the largest debtor against the largest creditor) gives a good-enough, auditable, dependency-free result. Hand-rolling it keeps the algorithm testable with plain Vitest unit tests and avoids trusting an unmaintained third-party package with financial logic. |
| No currency-conversion library this milestone | `money.js`, `@allratestoday/sdk`, `exchanger`, etc. | Only revisit if a future milestone explicitly requires converting a group's multi-currency balances into one "headline" number. For *this* milestone, PROJECT.md already flags "how per-expense currency balances are aggregated" as an open question with no resolved requirement — adding a live-rate conversion dependency (and the API-key/rate-staleness/rate-source-trust problems that come with it) before that requirement is even defined is premature. Track and display balances **grouped per currency** (Splitwise's own actual behavior: it does not silently convert either), which needs zero new dependencies. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|--------------|
| Migrating Cypress → Playwright as the fix for issue #71 | PROJECT.md's dependency policy for this milestone is explicit: Prisma is the *only* sanctioned major-version/framework change; everything else is patch/minor or config-only. A test-framework migration is a multi-week rewrite of the entire `test/cypress/` suite, not a performance fix, and is out of scope for a milestone that also ships bug fixes and a new feature. | Optimize within Cypress: spec splitting (`cypress-split`), disable video in `runMode`, parallel CI matrix, keep `testcontainers` reuse pattern already in place. |
| Any generic exchange-rate/currency-conversion package (see Alternatives table) | No requirement to convert currencies exists yet; adding one now means shipping unused code paths, an unvetted external rate source, and a false sense of "this is handled" before the actual aggregation UX is designed. | Per-currency balance grouping (no library). Revisit in a future milestone once the aggregation requirement is defined. |
| `splitwise-js-map` or other unmaintained "splitwise clone" npm packages | Financial correctness logic (who-owes-whom) from an unmaintained package is a liability — bugs there are silent-wrong-answer bugs, not build-time errors. | Hand-rolled greedy settlement function, unit-tested against known Splitwise example cases. |
| `jsonwebtoken` / `next-auth` / a new session library for the permanent member access links | The Splitting Group personal link is a single opaque bearer token looked up against a DB row (member record), not a signed/expiring session — JWTs add unnecessary complexity (signing keys, expiry semantics that don't apply to a "permanent" link) for something a `WHERE tokenHash = ?` query already solves. This can be implemented as a new, parallel authorization path alongside the existing Blitz session + CASL household guard (`src/lib/guard/ability.ts`), without pulling in a new auth library. | `node:crypto` token + DB lookup, gated through Blitz's existing `resolver.pipe()` pattern with a custom "resolve group member by token" step. |
| Prisma `Decimal`/`decimal.js`/`big.js` for the new Splitting Group `amount` fields | The existing `Transaction.amount` and `TransactionTemplate.amount` fields are both `Float` (MySQL `DOUBLE`) — introducing `Decimal` only for the new domain would be an inconsistent, half-migrated precision model across the codebase, and is a separate, larger decision (arguably a pitfall the *existing* app already has) that this milestone's scope does not call for. | Follow the established convention: `Float` columns for expense/income/settlement amounts, consistent with `transaction.prisma` and `transactionTemplate.prisma`. |
| Upgrading `prisma-mock` piecemeal or leaving it on 0.10.3 after the Prisma bump | 0.10.3's peer range does not cover `@prisma/client@7`; leaving it pinned will break every resolver unit test that mocks Prisma once `@prisma/client` is bumped. | `prisma-mock@1.1.0`, migrated to the `prisma-mock/client` entry point as part of the same PR that bumps Prisma. |

## Stack Patterns by Variant

**If the team wants zero CI cost increase while still parallelizing Cypress:**
- Use `cypress-split` with a small GitHub Actions matrix (e.g. `matrix: split: [1,2,3]`) rather than adopting Cypress Cloud.
- Because Cypress Cloud parallelization requires a paid/recorded run and a `CYPRESS_RECORD_KEY`; the project's CI has neither configured today, and `cypress-split`'s static/weighted splitting achieves most of the wall-clock win without that dependency.

**If per-currency balance display turns out to need a "headline number" in a later milestone:**
- Introduce a conversion library only then, and prefer a self-hosted/cached daily-rate table (e.g. via a scheduled BullMQ job hitting a rate provider once a day) over a live per-request API call.
- Because the app already has BullMQ + Redis for exactly this kind of "fetch and cache external data on a schedule" pattern (used today for recurring transactions) — reuse it instead of adding a client-side conversion SDK with its own caching/rate-limit story.

**If the personal access link needs to be revocable/rotatable later (not required this milestone per PROJECT.md):**
- Store `tokenHash` + `tokenCreatedAt` per member rather than a single immutable token column, so a future "regenerate my link" action is a one-column update.
- Because retrofitting revocation onto a token scheme with no hash/rotation metadata later is a schema migration; adding the extra column now costs nothing and doesn't violate the "permanent link" requirement (it stays permanent unless explicitly rotated).

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|------------------|-------|
| `prisma@7.9.1` / `@prisma/client@7.9.1` | `typescript@5.9.3` (existing) | Prisma 7 requires TypeScript 5.4+ (5.9.x recommended) — already satisfied by the project's current `typescript@5.9.3`, no TS bump needed. |
| `prisma@7.9.1` | `prisma-mock@1.1.0` | 0.10.3 (current) is **not** compatible — its peer range predates v7. Must bump together. |
| `@prisma/adapter-mariadb@7.9.1` | `mariadb@3.5.3` | Adapter's peer/runtime dependency; install both explicitly, don't rely on transitive resolution. |
| `prisma@7.9.1` generator output | `next.config.ts` webpack externals (`config.externals = [..., "@prisma/client"]`) | Prisma 7's default generator writes the client to a custom output path (e.g. `./generated/prisma`) instead of `node_modules/@prisma/client`. If the schema's `generator client` block is updated to `provider = "prisma-client"` with a custom `output`, the webpack `externals` entry and every `import ... from "@prisma/client"` across the codebase must be updated to the new import path — this is a mechanical but repo-wide find/replace, not optional. |
| `prisma@7.9.1` env var loading | Existing `dotenv-cli` usage (`dotenv -e .env.local prisma migrate dev`, etc.) | Prisma 7 stops auto-loading `.env` files itself, but this project already wraps every DB script with `dotenv-cli` in `package.json`, so those scripts keep working. The one gap: `"db:generate": "prisma generate"` has no `dotenv` prefix today — confirm `prisma generate` still works without a live `DATABASE_URL` under v7 (it should, since generation doesn't need a DB connection), and add the `prisma.config.ts` file (new in v7, replaces the `"prisma": { "seed": ... }` block in `package.json` and the `url`/`directUrl` fields in `schema.prisma`). |
| `mysql@9` (existing DB) | `mariadb` driver 3.5.3 | The `mariadb` npm driver is explicitly compatible with MySQL servers (not just MariaDB servers) per Prisma's own adapter docs — no database version change needed. |

## Sources

- https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7 — official Prisma v7 upgrade guide (fetched directly), confirms driver-adapter requirement, generator/output changes, prisma.config.ts, env-loading change, removed flags. Confidence: HIGH (primary vendor docs, cross-checked against npm registry showing 7.9.1 as a real published version).
- https://www.prisma.io/changelog/2025-11-19 — "Rust-free Prisma Client becomes the default" changelog entry. Confidence: HIGH.
- https://github.com/prisma/prisma/discussions/28689 — real-world breaking-change report for the MySQL adapter requirement (`engine type "client" requires ... "adapter"`). Confidence: MEDIUM (community discussion, but consistent with official docs).
- npm registry (`npm view`) — direct version checks for `prisma`, `@prisma/client`, `@prisma/adapter-mariadb` (7.9.1), `mariadb` (3.5.3), `prisma-mock` (1.1.0, peer dep `^7.0.0`), `nanoid` (6.0.1), `cypress-split` (1.25.0). Confidence: HIGH (authoritative version source).
- https://docs.cypress.io/app/guides/test-performance — official Cypress performance guide (spec-splitting rationale, per-spec overhead). Confidence: HIGH.
- Cypress parallelization community sources (Medium/DEV/testgrid.io articles on `cypress-split` vs. Cypress Cloud parallelization) — cross-checked across multiple independent posts. Confidence: MEDIUM.
- `.github/workflows/ci.yml`, `cypress.config.ts`, `package.json` (this repo) — read directly to confirm current CI has no Cypress Cloud recording key, single sequential job, and `video` left at its Cypress default. Confidence: HIGH (primary source, the repo itself).
- https://medium.com/@mithunmk93/algorithm-behind-splitwises-debt-simplification-feature-8ac485e97688 and related community write-ups on Splitwise's debt-simplification algorithm (greedy / min-cost-flow heuristic, NP-hard for true optimum). Confidence: MEDIUM (community analysis, not Splitwise's own published source, but consistent across multiple independent write-ups).
- `npm view splitwise-js-map` / npm search — low adoption/maintenance signal used to justify avoiding this package. Confidence: MEDIUM.
- Currency-conversion library search results (money.js, @allratestoday/sdk, exchanger, etc.) — used only to confirm "no clearly dominant, trustworthy option exists" for this niche; explicitly treated as LOW confidence / not adopted, per the "What NOT to Use" rationale above. Confidence: LOW (these are exactly the kind of results this research deliberately did not act on).
- `src/lib/db/schema/schema.prisma`, `src/lib/db/schema/transaction.prisma`, `src/lib/db/schema/transactionTemplate.prisma` (this repo) — read directly to confirm current generator config and `Float` amount convention. Confidence: HIGH (primary source).

---
*Stack research for: Financer v1.1.0 milestone (Prisma v7 migration, Cypress E2E performance, Financer Splitting Group)*
*Researched: 2026-08-21*
