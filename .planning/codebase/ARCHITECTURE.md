# Architecture

**Analysis Date:** 2026-03-10

## Pattern Overview

**Overall:** Blitz.js full-stack RPC + Next.js App Router with household-based multi-tenancy

**Key Characteristics:**
- Monolithic Next.js application combining frontend and backend
- RPC-based data fetching using Blitz.js (`@blitzjs/rpc`) instead of traditional REST APIs
- Server components (async) for data loading with fallback to client-side queries
- Role-based access control (RBAC) enforced via `@blitz-guard/core` at the RPC layer
- Household-scoped multi-tenancy (all data belongs to a household)
- Background job processing using BullMQ with Redis

## Layers

**Presentation Layer:**
- Purpose: UI rendering and user interaction
- Location: `src/app/` (page components, layouts) and `src/lib/components/` (reusable components)
- Contains: Server components (`.tsx` in `src/app/`), client components (`"use client"` in `src/lib/components/`), Radix UI primitives (`src/lib/components/ui/`)
- Depends on: Models (via RPC calls), Context providers, UI utilities
- Used by: Next.js router

**Data Access Layer (RPC Resolvers):**
- Purpose: Handle all business logic, database queries, and mutations with authorization
- Location: `src/lib/model/{entity}/{queries,mutations}/`
- Contains: Resolver functions using `resolver.pipe()`, Zod schema validation, authorization checks
- Depends on: Database (Prisma), Guard (authorization), Schemas
- Used by: Client components via `useQuery()` and `useMutation()` hooks; Server components via `invoke()`

**Authorization Layer:**
- Purpose: Enforce role-based access control at RPC level
- Location: `src/lib/guard/` with `ability.ts` defining resource/action rules
- Contains: Guard builder with user roles (ADMIN, USER) and household roles (OWNER, ADMIN, MEMBER, GUEST)
- Depends on: Database (to verify household membership)
- Used by: All resolvers via `Guard.authorizePipe()` middleware

**Database Layer:**
- Purpose: Data persistence and schema definition
- Location: `src/lib/db/` (Prisma client) and `src/lib/db/schema/` (schema + migrations)
- Contains: Prisma client (enhanced by Blitz), MySQL database connection, incremental migration files
- Depends on: MySQL database
- Used by: All resolvers and services

**Service Layer:**
- Purpose: Encapsulate complex business logic that spans multiple entities
- Location: `src/lib/model/{entity}/services/`
- Contains: Import processing, template generation, data transformation
- Example: `src/lib/model/imports/services/importProcessor.ts` - handles CSV parsing, amount formatting, transaction creation
- Depends on: Database, utilities
- Used by: Mutations and queries

**Background Job Layer:**
- Purpose: Async processing for long-running operations
- Location: `src/lib/jobs/`
- Contains: BullMQ job definitions and workers
- Depends on: Redis, Database
- Used by: Scheduled cron jobs and import operations

**Utility Layer:**
- Purpose: Cross-cutting concerns and formatters
- Location: `src/lib/util/`, `src/lib/hooks/`, `src/lib/components/provider/`
- Contains: Formatters (currency, date, user), file storage, Zod schemas, React hooks
- Depends on: None
- Used by: All layers

## Data Flow

**Query Flow (Data Fetching):**

1. Server component calls `invoke(getTransactions, {...}, ctx)` or client component calls `useQuery(getTransactions, {...})`
2. Request routes to `src/app/api/rpc/[[...blitz]]/route.ts` via RPC handler
3. Resolver `getTransactions.ts` receives request:
   - Validates input via `resolver.zod(schema)`
   - Checks authorization via `resolver.authorize()`
   - Fetches from database via Prisma with relations
4. Response returns to component
5. Client components re-render; server components use data in initial render

**Mutation Flow (Data Modification):**

1. Client component calls `useMutation(createTransaction)` and executes mutation with input
2. Request routes to RPC handler
3. Resolver `createTransaction.ts` executes:
   - Validates schema: `resolver.zod(CreateTransactionSchema)`
   - Authorizes: `resolver.authorize()` then `Guard.authorizePipe("create", "Transaction")`
   - Transforms data (e.g., adjusts amount sign based on transaction type)
   - Creates database record with relations (tags, attachments)
4. Response returns to component; mutation state updates UI

**Background Job Flow (Async Processing):**

1. Admin settings define cron time (e.g., "00:00" for transaction template generation)
2. `src/lib/jobs/init.server.ts` registers cron job on server startup
3. BullMQ worker processes job at scheduled time
4. Worker creates transaction records or processes imports from Redis queue

**Page Load Flow:**

1. User requests authenticated page (e.g., `/dashboard`)
2. Layout (`src/app/(internal)/layout.tsx`) executes `invoke(getCurrentUser, {})` server-side
3. If not authenticated, redirects to `/login`
4. Fetches additional data: household, settings, onboarding status
5. Renders layout with providers (HouseholdProvider, etc.)
6. Child page component renders with providers and fetches page-specific data

**State Management:**

- **Server State:** Prisma database (single source of truth)
- **Request State:** Household context (`useCurrentHousehold()`) provided via context
- **Client State:** React Query (via `@blitzjs/rpc`) caches RPC responses with automatic invalidation
- **UI State:** Component-local state (useState), no global client state manager

## Key Abstractions

**Resolver Pattern:**
- Purpose: Centralized RPC handler combining validation, auth, and business logic
- Examples: `src/lib/model/transactions/queries/getTransactions.ts`, `src/lib/model/transactions/mutations/createTransaction.ts`
- Pattern: `resolver.pipe(zod validation, authorize check, guard check, async handler)`
- Each resolver is a typed async function serving as both API endpoint and RPC target

**Guard Ability System:**
- Purpose: Declarative, resource-action based authorization
- File: `src/lib/guard/ability.ts`
- Pattern: User roles (ADMIN, USER) define which household roles (OWNER, ADMIN, MEMBER, GUEST) can perform which actions (create, read, update, delete, invite, manage)
- Used: `Guard.authorizePipe("create", "Household")` checks ability before mutation executes

**Provider Pattern:**
- Purpose: Share household/entity data with nested components via React Context
- Examples: `HouseholdProvider`, `CategoryProvider`, `AccountProvider`, `TagProvider`
- Pattern: Provider fetches data via `useQuery()`, exposes context + custom hooks
- Usage: Wrap pages/sections to enable child components to access data without prop drilling

**Service Layer Pattern:**
- Purpose: Complex domain logic isolated from resolvers
- Example: `importProcessor.ts` contains CSV parsing, amount formatting, mapping logic
- Pattern: Pure functions or classes that take domain models and return transformed results
- Resolver calls service, passes result to Prisma for persistence

**Schema Pattern:**
- Purpose: Validation and type safety for RPC inputs
- Location: `src/lib/model/{entity}/schemas.ts`
- Pattern: Zod schemas for create/update/delete inputs
- Example: `CreateTransactionSchema` defines required/optional fields with validation rules

## Entry Points

**Web Application Entry:**
- Location: `src/app/layout.tsx`
- Triggers: User navigates to any URL
- Responsibilities: Root HTML structure, Blitz provider setup, theme script injection, Toaster initialization

**Authenticated App Entry:**
- Location: `src/app/(internal)/layout.tsx`
- Triggers: User is logged in and accesses `/dashboard/*`, `/transactions/*`, etc.
- Responsibilities: Authentication check, onboarding validation, household context, sidebar navigation layout

**API Entry Points:**
- RPC Handler: `src/app/api/rpc/[[...blitz]]/route.ts` - routes all RPC calls to resolvers
- File Upload: `src/app/api/imports/upload/route.ts`, `src/app/api/transactions/attachments/upload/route.ts`
- Health Check: `src/app/api/health-check/route.ts` - returns app and database status
- Jobs: `src/app/api/jobs/route.ts` - webhook for external job triggers
- Avatar/Config: `src/app/api/users/avatar/[userId]/route.ts`, `src/app/api/config/route.ts`

**Auth Entry Points:**
- Login: `src/app/(auth)/login/page.tsx` - LoginForm component
- Signup: `src/app/(auth)/signup/page.tsx`
- Password Reset: `src/app/(auth)/forgot-password/page.tsx`, `src/app/(auth)/reset-password/page.tsx`

## Error Handling

**Strategy:** Layered error handling with informative messages

**Patterns:**

1. **Validation Errors:** Zod throws `ZodError` → converted to API error response with field details
2. **Authorization Errors:** Guard throws or resolver returns `false` → `403 Forbidden` or `401 Unauthorized`
3. **Not Found Errors:** Resolvers throw `NotFoundError` (from Blitz) → `404` response
4. **Database Errors:** Prisma errors caught and wrapped with context
5. **Client-side:** `useMutation` hook provides `error` state; components can catch and display via toast or inline
6. **Server Components:** Wrapped in try-catch, redirect on critical errors (auth, onboarding)

## Cross-Cutting Concerns

**Logging:**
- Blitz logger configured in `src/app/blitz-server.ts` with level control via `LOG_LEVEL` env var
- Resolver logging: verbose mode enabled in `src/app/api/rpc/[[...blitz]]/route.ts` for DEBUG level
- Background jobs log to console in `src/lib/jobs/init.server.ts`

**Validation:**
- All RPC inputs validated via Zod schemas in resolvers
- File uploads validated in route handlers (e.g., CSV file in imports)
- Frontend validation mirrors backend (formik + Zod adapter in forms)

**Authentication:**
- Blitz Auth plugin manages sessions via Prisma storage
- Session attached to context object passed to resolvers
- `ctx.session.userId` and `ctx.session.role` available in resolvers
- Pages decorated with `RootLayout.authenticate = { redirectTo: "/login" }` enforce auth

**Multi-tenancy:**
- All data scoped to household: `where: { account: { householdId } }`
- Household ID resolved from current user's membership
- Guards verify household membership before CRUD operations
- Settings, categories, accounts, transactions, etc. all household-scoped

**File Handling:**
- Temporary files: `data/temp/{uuid}/` (cleared periodically)
- Transaction attachments: `data/transactions/{txnId}/attachments/`
- User avatars: Stored in database path, served via `src/app/api/users/avatar/[userId]/route.ts`
- Import processing: CSV uploaded → processed → stored results in database

---

*Architecture analysis: 2026-03-10*
