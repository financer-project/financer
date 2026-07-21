<!-- refreshed: 2026-07-21 -->
# Architecture

**Analysis Date:** 2026-07-21

## System Overview

```text
┌────────────────────────────────────────────────────────────────────┐
│                         Client Layer (React)                       │
│   Pages (`src/app`) | Components (`src/lib/components`)            │
└──────────────────────────────┬───────────────────────────────────┘
                               │ RPC Calls
                               ▼
┌────────────────────────────────────────────────────────────────────┐
│                  Business Logic Layer (Blitz RPC)                  │
│   Queries & Mutations (`src/lib/model/[domain]`)                   │
│   ├─ Input Validation (Zod schemas)                                │
│   ├─ Authorization (Blitz Guard + CASL)                            │
│   └─ Business Logic & Orchestration                                │
└──────────────────────────────┬───────────────────────────────────┘
                               │ Database Operations
                               ▼
┌────────────────────────────────────────────────────────────────────┐
│               Data Access Layer (Prisma ORM)                       │
│   Models (`src/lib/db/schema/*.prisma`)                            │
│   MySQL Database Connection                                        │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│              Infrastructure & Cross-Cutting Concerns               │
│   Jobs (BullMQ + Redis) | Mailers | Guards | Utilities            │
└────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| **Pages & Routes** | Next.js page components, URL routing, layout composition | `src/app/(auth)/*`, `src/app/(internal)/*` |
| **UI Components** | Reusable React components (forms, dialogs, tables, primitives) | `src/lib/components/ui/*`, `src/lib/components/common/*` |
| **Content Components** | Domain-specific component compositions | `src/lib/components/content/*` |
| **RPC Resolvers (Queries)** | Read operations, data fetching, aggregations | `src/lib/model/[domain]/queries/*` |
| **RPC Resolvers (Mutations)** | Write operations, state changes, commands | `src/lib/model/[domain]/mutations/*` |
| **Business Services** | Complex business logic, data transformation, import/export | `src/lib/model/[domain]/services/*` |
| **Authorization (Guard)** | CASL-based permission rules, household role checking | `src/lib/guard/ability.ts` |
| **Database Schema** | Prisma models, relationships, constraints | `src/lib/db/schema/*.prisma` |
| **Background Jobs** | Async processing: imports, transaction template execution | `src/lib/jobs/index.ts` |
| **Email Service** | Transactional email templates and sending | `src/lib/mailers/*` |
| **Utilities** | Formatters, Zod validation schemas, file handling | `src/lib/util/*` |

## Pattern Overview

**Overall:** Layered architecture with Domain-Driven Design (DDD) bounded contexts, CQRS pattern for queries/mutations, and Blitz.js full-stack framework integration.

**Key Characteristics:**
- **Full-stack monolith**: Single Next.js application with co-located frontend and backend
- **Domain isolation**: Each domain (households, accounts, transactions, etc.) owns its models, queries, and mutations
- **Type safety**: TypeScript throughout, Prisma generated types, Zod for runtime validation
- **Authorization-first**: CASL-based permissions enforced at resolver level with household role hierarchy
- **Async-by-design**: Background jobs for imports and scheduled transaction templates via BullMQ
- **Composable UI**: React context providers for shared domain data (households, accounts, categories)

## Layers

**Presentation Layer:**
- Purpose: Render UI, handle user interactions, manage client-side state
- Location: `src/app`, `src/lib/components`
- Contains: Next.js pages, React components (functional), layout compositions, forms
- Depends on: RPC resolvers (via Blitz client), React context providers, UI libraries (Radix UI, Tailwind)
- Used by: End users, browsers

**Business Logic Layer:**
- Purpose: Enforce business rules, authorize operations, transform data, orchestrate workflows
- Location: `src/lib/model/[domain]/{queries,mutations,services}`
- Contains: RPC resolvers with `resolver.pipe()`, Zod schemas, Guard authorization checks, domain-specific logic
- Depends on: Database (Prisma), Guard (authorization), external services (email, file storage, jobs)
- Used by: Presentation layer via RPC, background workers

**Authorization Layer:**
- Purpose: Define and enforce access control rules based on user role and household role
- Location: `src/lib/guard/ability.ts`
- Contains: CASL GuardBuilder configuration, role-based permission rules (ADMIN vs USER), household role hierarchy (OWNER > ADMIN > MEMBER > GUEST)
- Depends on: Prisma (for household membership checks), Blitz context (session, userId)
- Used by: All mutations and protected queries via `Guard.authorizePipe()`

**Data Access Layer:**
- Purpose: Define data models, manage database connections, handle ORM operations
- Location: `src/lib/db`
- Contains: Prisma schema files (modularized by domain), enhanced Prisma client with Blitz integration
- Depends on: MySQL database, Prisma client generation
- Used by: Business logic layer

**Infrastructure & Services:**
- Purpose: Handle cross-cutting concerns and asynchronous operations
- Location: `src/lib/jobs`, `src/lib/mailers`, `src/lib/hooks`, `src/lib/util`
- Contains: BullMQ worker setup, email templates, React hooks, utility functions
- Depends on: Redis (for jobs), external email service, database
- Used by: Mutations, scheduled workers, UI components

## Data Flow

### Primary Request Path (Mutation - Create Transaction)

1. **User submits form** → Form component in `src/app/(internal)/transactions/components/TransactionForm.tsx`
2. **Component invokes mutation** → Calls `src/lib/model/transactions/mutations/createTransaction.ts` via Blitz RPC
3. **Input validation** → Zod schema `CreateTransactionSchema` validates request data
4. **Authorization check** → `resolver.authorize()` verifies user is authenticated; `Guard.authorizePipe()` checks if user can create transactions in the target household
5. **Business logic** → Transaction amount adjusted based on type (EXPENSE negative, INCOME positive); tags connected if provided
6. **Database operation** → `db.transaction.create()` persists to MySQL via Prisma
7. **Response** → Serialized transaction object returned to client component
8. **UI update** → React state updated; cache invalidated via Blitz's RPC layer

### Read Path (Query - Get Transactions)

1. **Component mounts** → Calls `src/lib/model/transactions/queries/getTransactions.ts`
2. **Authorization** → Verifies authenticated user
3. **Context handling** → Resolves current household from session private data
4. **Query building** → Where/orderBy clauses validated with Zod; filters constrained to current household's accounts
5. **Database fetch** → Prisma `findMany()` with includes (category, counterparty, account, tags, attachments, createdBy)
6. **Pagination** → Returns paginated results with `hasMore`, `nextPage`, `count`
7. **Response** → Serialized transaction list returned to component

### Background Job Path (Import Processing)

1. **User uploads import file** → Invokes `src/lib/model/imports/mutations/createImportJob.ts`
2. **Job queued** → `queueImportJob()` adds job to `importQueue` (BullMQ) via Redis
3. **Worker picks up** → `importWorker` in `src/lib/jobs/index.ts` processes job
4. **File processing** → `importProcessor` reads file, applies column/value mappings, creates transactions
5. **Batch creation** → Transactions created via `db.transaction.createMany()`
6. **Completion callback** → Job marked complete; UI can poll or use webhooks to detect completion

### Scheduled Job Path (Transaction Templates)

1. **User sets recurring time** → `registerTransactionTemplatesJob()` converts "HH:mm" to cron via `timeToCron()`
2. **Job scheduled** → BullMQ registers repeatable job with cron pattern
3. **Cron trigger** → `transactionTemplatesWorker` runs at scheduled time
4. **Template processing** → `processTransactionTemplates()` finds eligible templates, creates transactions
5. **Completion** → Worker emits "completed" event (logged to console)

**State Management:**
- **Session state**: Stored in Blitz Session via Prisma, contains userId, role, currentHouseholdId (via privateData)
- **UI state**: React hooks (useState), Context (HouseholdProvider, AccountProvider, etc.), component-level state
- **Server state**: Prisma ORM cache per request, no cross-request caching layer
- **Redis state**: Job queues (import, transaction-templates), used for job tracking only

## Key Abstractions

**RPC Resolver:**
- Purpose: Define a queryable/callable server function from the client
- Examples: `src/lib/model/transactions/queries/getTransactions.ts`, `src/lib/model/transactions/mutations/createTransaction.ts`
- Pattern: `resolver.pipe(validation → authorize → logic)` enables composable middleware chain

**Zod Schema:**
- Purpose: Validate and type input data at runtime
- Examples: `CreateTransactionSchema`, `UpdateTransactionSchema` in `src/lib/model/transactions/schemas.ts`
- Pattern: Centralized schema files per domain; exported for TypeScript type inference

**Guard (CASL):**
- Purpose: Define and check permissions based on roles and resource context
- Example: `Guard.authorizePipe("create", "Transaction")` in mutations
- Pattern: Role-based (ADMIN/USER at app level; OWNER/ADMIN/MEMBER/GUEST at household level)

**Provider (React Context):**
- Purpose: Share domain data across component tree without prop drilling
- Examples: `HouseholdProvider`, `AccountProvider`, `CategoryProvider` in `src/lib/components/provider/*`
- Pattern: Wraps page content; fetches data server-side; provides via context hook

**Service:**
- Purpose: Encapsulate complex business logic, data transformation, or external service integration
- Examples: `importProcessor` in `src/lib/model/imports/services/`, `templateProcessor` in `src/lib/model/transactionTemplates/services/`
- Pattern: Exported async functions called from mutations or workers; handle side effects

## Entry Points

**Web Application Entry:**
- Location: `src/app/layout.tsx`
- Triggers: Browser requests to `/`
- Responsibilities: Render HTML shell, load BlitzProvider, setup global styles, theme script injection

**Authenticated Application Entry:**
- Location: `src/app/(internal)/layout.tsx`
- Triggers: Browser requests to any route under `/(internal)/*`
- Responsibilities: Fetch current user, enforce login redirect, check onboarding status, setup sidebar navigation, household context

**Authentication Routes Entry:**
- Location: `src/app/(auth)/layout.tsx`
- Triggers: Browser requests to `/login`, `/signup`, `/forgot-password`, `/reset-password`
- Responsibilities: Render auth form layouts

**API Health Check:**
- Location: `src/app/api/health-check/route.ts`
- Triggers: GET `/api/health-check`
- Responsibilities: Return 200 OK for load balancer health checks

**API Config:**
- Location: `src/app/api/config/route.ts`
- Triggers: GET `/api/config`
- Responsibilities: Return client-side config (e.g., feature flags, environment info)

**API Jobs Webhook:**
- Location: `src/app/api/jobs/route.ts`
- Triggers: POST `/api/jobs` (from external job processor if needed)
- Responsibilities: Trigger background job processing

**Blitz Server Setup:**
- Location: `src/app/blitz-server.ts`
- Triggers: Server startup
- Responsibilities: Initialize Blitz RPC server, authentication plugin, logging

**Blitz Client Setup:**
- Location: `src/app/blitz-client.ts`
- Triggers: Client hydration
- Responsibilities: Initialize Blitz RPC client, authentication client plugin

## Architectural Constraints

- **Single Next.js instance**: Entire application runs in one process; no separate backend service
- **Session-based auth**: Uses Blitz Auth with Prisma storage and token-based session validation
- **MySQL dependency**: All data persistence via Prisma → MySQL; no support for other databases without schema migration
- **Redis dependency**: Background jobs (BullMQ) require Redis; application fails to start if Redis unavailable
- **Household isolation**: All data queries filtered by household; must pass householdId or derive from session
- **Single-tenant architecture**: No cross-household data leakage; household is the security boundary
- **Sync-first mutations**: No optimistic updates; mutations await completion before returning to client
- **No global state machine**: Event sourcing not implemented; Prisma tracks snapshots only

## Anti-Patterns

### Anti-Pattern: Calling mutations inside other mutations

**What happens:** A mutation invokes another mutation via `db` operations instead of composing through the resolver layer.
**Why it's wrong:** Loses request context (session, userId), authorization checks don't cascade, error handling chains don't work.
**Do this instead:** Extract shared logic into a service (e.g., `src/lib/model/transactions/services/createTransactionLogic.ts`) and call from both mutations. Let the first mutation's authorization check protect both flows. Example: see `src/lib/model/transactions/mutations/createTransaction.ts` → shared logic should live in services/, then imported by mutation.

### Anti-Pattern: Storing sensitive data in public data

**What happens:** API keys, passwords, or personal identifiable information stored in `publicData` of session.
**Why it's wrong:** `publicData` is encoded in session token and sent to client; can be decoded if token is intercepted.
**Do this instead:** Store only non-sensitive info in `publicData` (userId, householdId, userName). For sensitive data, query database on each request or use `privateData` with short TTL. See `src/app/(internal)/layout.tsx` line 35 for correct pattern: `ctx.session.$getPrivateData()`.

### Anti-Pattern: N+1 queries in loops

**What happens:** Mutation iterates over items, calling `db.X.findUnique()` or similar in each iteration (e.g., import processor creating transactions one at a time).
**Why it's wrong:** Each iteration triggers a database round-trip; scales poorly with large imports.
**Do this instead:** Use Prisma batch operations like `createMany()`, `updateMany()`, or `findMany()` with `in:` operator. See `src/lib/model/imports/services/importProcessor.ts` for correct pattern with batch creation.

### Anti-Pattern: Side effects in queries

**What happens:** A query calls `db.X.update()` or modifies state (e.g., incrementing a counter while reading).
**Why it's wrong:** Queries should be idempotent; repeated calls should return same result; violates CQRS separation.
**Do this instead:** Use mutations for side effects. If read and write are interdependent (e.g., "get current household and set it"), split into separate calls or use a mutation. Example: `changeCurrentHousehold()` is a mutation even though it reads; it modifies session state.

## Error Handling

**Strategy:** Blitz resolver middleware catches errors; throws `NotFoundError`, `AuthorizationError`, or `ValidationError` from blitz package.

**Patterns:**
- **Input validation failure**: Zod schema validation fails → caught by `resolver.zod()` → 422 Unprocessable Entity returned
- **Authorization failure**: `resolver.authorize()` fails (not logged in) → 401 Unauthorized
- **Permission check failure**: `Guard.authorizePipe()` fails (no permission) → 403 Forbidden
- **Resource not found**: Throw `NotFoundError` (e.g., account not found in mutation) → 404 Not Found
- **Business logic error**: Throw custom Error with message → 500 Internal Server Error
- **Database error**: Prisma throws PrismaClientError → 500 Internal Server Error (log full error server-side)

Example (see `src/lib/model/transactions/mutations/createTransaction.ts` line 13):
```typescript
if (!account) throw new NotFoundError(`Account with ID ${input.accountId} does not exist`)
```

## Cross-Cutting Concerns

**Logging:** 
- Configured in `src/app/blitz-server.ts` via `BlitzLogger` with `LOG_LEVEL` env var
- Levels: DEBUG (2) → INFO (3) → WARNING (4) → ERROR (5)
- Uses Blitz built-in logger for RPC/auth events; custom `console.log()` for job worker events
- No centralized logger (Pino, Winston, etc.); relies on environment-level log aggregation

**Validation:**
- Input: Zod schemas in `src/lib/model/[domain]/schemas.ts`, applied via `resolver.zod(Schema)`
- Database: Prisma schema constraints (unique, required fields, enums)
- Business: Guard (CASL) for authorization; query filters for household isolation
- Output: Automatic type safety via Prisma generated types and TypeScript

**Authentication:**
- Implemented via `@blitzjs/auth` plugin in `src/app/blitz-server.ts`
- Stores sessions in Prisma `Session` model; tokens in `Token` model
- Session contains: userId, role, currentHouseholdId (privateData), userName (publicData)
- Protected queries/mutations: `resolver.authorize()` enforces authenticated session

**Authorization (Household Isolation):**
- Implemented via Blitz Guard (CASL) in `src/lib/guard/ability.ts`
- User roles: ADMIN (global), USER (default)
- Household roles: OWNER, ADMIN, MEMBER, GUEST
- All queries filter by current household; mutations check Guard rules before executing
- See `getCurrentHousehold()` query for session household switching pattern

---

*Architecture analysis: 2026-07-21*
