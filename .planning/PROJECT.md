# Financer

## What This Is

Financer is a self-hosted, comprehensive personal finance management application for households. Households (families or groups living finances together) track accounts, transactions, categories, counterparties, and recurring transaction templates, with role-based collaboration (OWNER/ADMIN/MEMBER/GUEST). Built with Next.js, TypeScript, and Blitz.js.

## Core Value

Households can reliably track, categorize, and understand their shared finances together ÔÇö accurate transaction data and household collaboration must always work.

## Requirements

### Validated

- Ô£ô Household management with multi-user collaboration and role-based access (OWNER/ADMIN/MEMBER/GUEST) ÔÇö existing
- Ô£ô Transaction tracking (accounts, categories, tags, counterparties, attachments) ÔÇö existing
- Ô£ô Recurring transaction templates (cron-scheduled via BullMQ) ÔÇö existing
- Ô£ô CSV import via background jobs ÔÇö existing
- Ô£ô Dashboard & analytics (charts via Recharts) ÔÇö existing
- Ô£ô User authentication, profiles, and session management (Blitz Auth) ÔÇö existing
- Ô£ô Dark/light theme support ÔÇö existing
- Ô£ô Demo data seeding ÔÇö existing

### Active

- [ ] Fix: Counterparty filter throws an error on the Transaction List (#78)
- [ ] Fix: Tab key navigation broken in forms ÔÇö date and select fields don't receive focus correctly (#76)
- [ ] Improve Cypress E2E test suite performance (#71)
- [ ] Upgrade Prisma to v7 (major version migration)
- [ ] Update remaining dependencies within their current major versions (patch/minor only)
- [ ] Financer Splitting Group feature (#67) ÔÇö Splitwise-style shared expense groups:
  - Groups are a domain fully separate from Households (no shared accounts/categories)
  - Only registered users can create a group (organizer)
  - Groups can be time-limited (start/end period)
  - Each member (registered or not) gets their own permanent personal link for full participant access (add/edit/delete own expenses, view balances and all expenses, settle debts) ÔÇö link keeps working after the group closes
  - Expenses/income can be split across all members or a specified subset
  - Each expense/income entry has its own currency (no group-wide single currency)
  - Each member has a running balance (who owes whom); debts can be compensated, recorded as a "negative expense"

### Out of Scope

- Groups reusing the Household/account data model ÔÇö why: keeps the household security/permission model isolated from public-link-based group access
- Group creation by non-registered/anonymous users ÔÇö why: organizer must be an accountable, logged-in user; members can still join without registering

## Context

- Existing brownfield codebase, mapped via `/gsd-map-codebase` (`.planning/codebase/`) prior to this milestone ÔÇö see ARCHITECTURE.md, STACK.md, CONVENTIONS.md, STRUCTURE.md, TESTING.md, INTEGRATIONS.md, CONCERNS.md for established patterns
- Layered architecture: Next.js/React presentation ÔåÆ Blitz RPC business logic (`resolver.pipe()`) ÔåÆ Prisma/MySQL data access, with CASL-based household authorization (`src/lib/guard/ability.ts`)
- Background jobs (imports, recurring transaction templates) run via BullMQ + Redis
- Bugs #78 and #76, and the Cypress performance task #71, are pre-existing tracked GitHub issues being addressed in this milestone
- Dependency baseline (as of last stack analysis): Blitz.js 2.2.1, Next.js 15.5.12, React 19.2.4, Prisma 6.19.2, TypeScript 5.9.3 ÔÇö Prisma is being deliberately taken to v7 (major bump); everything else stays within its current major version this milestone
- Open question carried into requirements/roadmap: how per-expense currency balances are aggregated/displayed for a group's overall balance (no conversion mechanism exists yet in the codebase)

## Constraints

- **Tech stack**: Next.js/Blitz.js/TypeScript/Prisma/MySQL/Redis ÔÇö new work must follow existing layered architecture and conventions (see `.planning/codebase/CONVENTIONS.md`)
- **Household isolation**: Existing security boundary ÔÇö Splitting Groups must not weaken or bypass household data isolation
- **Dependency policy (this milestone)**: Prisma ÔåÆ v7 explicitly; all other dependencies patch/minor only, no other major bumps

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Splitting Groups are a separate domain from Households | Avoids entangling public-link, non-registered-user access with the household security model | ÔÇö Pending |
| Group member links grant full participant access (add/edit/delete own expenses, view all, settle debts) | Matches Splitwise-style UX; simplifies permission model to one tier | ÔÇö Pending |
| Only registered users can create (organize) a group | Keeps group ownership accountable; members can still be non-registered | ÔÇö Pending |
| Per-expense currency (not one currency per group) | Matches real shared-expense scenarios (e.g. travel groups spending in multiple currencies) | ÔÇö Pending |
| Prisma upgraded to v7 this milestone; other deps patch/minor only | Deliberate, bounded major-version risk while keeping the rest of the upgrade low-risk | ÔÇö Pending |
| Bundle #71 (Cypress performance) into this milestone alongside #78/#76 | User chose to address dev-workflow friction alongside user-facing bugs | ÔÇö Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? ÔåÆ Move to Out of Scope with reason
2. Requirements validated? ÔåÆ Move to Validated with phase reference
3. New requirements emerged? ÔåÆ Add to Active
4. Decisions to log? ÔåÆ Add to Key Decisions
5. "What This Is" still accurate? ÔåÆ Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check ÔÇö still the right priority?
3. Audit Out of Scope ÔÇö reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-08-21 after initialization*
