# Coding Conventions

**Analysis Date:** 2026-03-10

## Naming Patterns

**Files:**
- Mutations: `createX.ts`, `updateX.ts`, `deleteX.ts` (camelCase, verb-first)
- Queries: `getX.ts`, `getXs.ts` (camelCase, verb-first)
- Hooks: `useX.ts` or `use-kebab-case.ts` (React convention with dash-separated for utility hooks)
- Schemas: `schemas.ts` (singular, collocated with queries/mutations)
- Components: PascalCase (e.g., `AccountProvider.tsx`, `ConfirmationDialog.tsx`)
- Test files: `*.test.ts` or `*.spec.ts` (e.g., `counterparty.test.ts`)

**Functions:**
- PascalCase for component names: `AccountProvider`, `ConfirmationDialog`
- camelCase for utility functions and hooks: `useCurrentUser`, `useIsMobile`, `useDebounce`
- camelCase for resolver handlers (exported as default or named)

**Variables:**
- camelCase for all local variables and constants
- UPPER_SNAKE_CASE for enum-like constants (see Prisma enums: `ImportStatus.DRAFT`)
- Underscores allowed: `hookTimeout`, `testTimeout` in config files

**Types:**
- PascalCase for all type definitions: `AuthenticatedCtx`, `PrivateData`, `Ability`
- PascalCase for exported schema types: `CreateAccountSchema`
- Inline type annotations use `{}` with camelCase properties
- Generic types use single letters: `<T>` for basic, `<Prisma.XWhereInput>` for database

## Code Style

**Formatting:**
- ESLint with TypeScript support (version 9.39.1)
- Config: `eslint.config.ts` (modern ESLint flat config format)
- Linting triggered pre-commit via `lint-staged` for `*.{js,ts,tsx}` files
- Default indentation appears to be 4 spaces (based on file samples)

**Linting:**
- Tool: ESLint with plugins for TypeScript, React, React Hooks, Next.js, and imports
- Rules configured:
  - `@typescript-eslint/triple-slash-reference: off` for next-env.d.ts
  - `ts/return-await: 2` (enforced)
  - React JSX runtime rules enabled
  - React Hooks recommended rules applied
  - Next.js core web vitals rules enforced

**Key Rules:**
- Triple-slash references disabled for generated files
- Return-await enforced (must use `await` in async returns)
- React 19 detected automatically

## Import Organization

**Order:**
1. External packages (`@blitzjs`, `@prisma`, `react`, `zod`, etc.)
2. Internal absolute paths (`@/src/lib`, `@/test`, `@/types`)
3. Relative imports (rarely used; absolute paths preferred)

**Path Aliases:**
- `@/*` maps to project root (enables `@/src/lib`, `@/test/utility`, etc.)
- Imports use full paths: `@/src/lib/db`, `@/src/lib/model/`, `@/src/lib/guard/`

**Import Examples:**
```typescript
// Mutations and Queries
import { resolver } from "@blitzjs/rpc"
import db from "@/src/lib/db"
import { CreateAccountSchema } from "@/src/lib/model/account/schemas"
import Guard from "@/src/lib/guard/ability"

// React Components
import React, { createContext, useContext } from "react"
import { useQuery } from "@blitzjs/rpc"
import { Account } from "@prisma/client"

// Test Imports
import { describe, expect, test, vi } from "vitest"
import TestUtilityMock from "@/test/utility/TestUtilityMock"
```

## Error Handling

**Patterns:**
- Errors thrown explicitly with descriptive messages: `throw new Error("Message")`
- Type-specific errors: `AuthenticationError` from blitz for auth failures
- Database errors propagate naturally (Prisma throws)
- No silent error suppression; all errors bubble to caller
- Validation errors caught via Zod schema validation in resolvers

**Resolver Pattern:**
```typescript
// Standard resolver pipeline with error handling
export default resolver.pipe(
    resolver.zod(Schema),           // Validation errors thrown here
    resolver.authorize(),            // Auth errors thrown here
    Guard.authorizePipe(...),        // Permission errors thrown here
    async (input) => {
        return db.model.create(...)  // DB errors propagate
    }
)
```

## Logging

**Framework:** `console` (no custom logging library detected)

**Patterns:**
- Minimal logging in source code (none found in reviewed files)
- Cypress tests include debug logging: `console.log(args)` with ESLint disable when necessary
- No structured logging framework in use

## Comments

**When to Comment:**
- Rare in the codebase; code is self-documenting through naming
- Logic comments present only when non-obvious (e.g., state closure comments in test utilities)
- TODO/FIXME comments not commonly used

**JSDoc/TSDoc:**
- Not enforced in the codebase
- Type annotations via TypeScript handle documentation for functions
- No explicit JSDoc comments observed in reviewed files

## Function Design

**Size:** Compact and focused (resolvers typically 5-15 lines)

**Parameters:**
- Zod-validated input objects (schema-driven)
- Context parameter for auth/session info
- Named object parameters preferred over positional

**Return Values:**
- Resolvers return typed database models or computed objects
- Queries return paginated results or single entities
- Mutations return created/updated/deleted entities

**Examples:**
```typescript
// Query resolver with pagination
export default resolver.pipe(
    resolver.zod(GetAccountsSchema),
    resolver.authorize(),
    async ({ where, orderBy, skip = 0, take = 100, householdId }, ctx) => {
        // ... pagination logic
        return { accounts, nextPage, hasMore, count }
    }
)

// Hook pattern
export const useCurrentUser = () => {
    const [user] = useQuery(getCurrentUser, null)
    if (!user) throw new Error("No user found")
    return user
}
```

## Module Design

**Exports:**
- `export default` for main resolvers/mutations/queries
- Named exports for schemas: `export const CreateAccountSchema = z.object(...)`
- Singleton pattern for test utilities: static `getInstance()` method
- Context providers exported as default components

**Barrel Files:**
- Used selectively (e.g., `src/lib/components/content/page/index.ts`)
- Not prevalent throughout codebase

## Async/Await

**Pattern:** Consistent use of async/await, no Promise chains

**Example:**
```typescript
async ({ input }, ctx) => {
    const result = await db.account.create({ data: input })
    return result
}
```

---

*Convention analysis: 2026-03-10*
