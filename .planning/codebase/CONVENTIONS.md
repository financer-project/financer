# Coding Conventions

**Analysis Date:** 2026-07-21

## Naming Patterns

**Files:**
- PascalCase for React components: `LoginForm.tsx`, `CategoryForm.tsx`, `EditCategory.tsx`
- camelCase for utility functions and non-component files: `fileStorage.ts`, `zodUtil.ts`
- kebab-case for directories and Next.js routes: `auth`, `categories`, `counterparties`
- Schema files: `schemas.ts`, `validations.ts` (co-located with related components)
- Index/barrel files: `index.ts` for re-exporting modules

**Functions:**
- camelCase for all function names: `createAccount()`, `getAccounts()`, `validateEmail()`
- Async functions follow same convention: `authenticateUser()`, `seedDatabase()`
- Exported mutations use named exports: `export const updateAccount = ...`
- Query/mutation resolvers use `export default resolver.pipe(...)`

**Variables:**
- camelCase for all variables and constants: `email`, `firstName`, `householdId`
- UPPER_SNAKE_CASE for token types and enum-like constants: `TokenType.INVITATION`, `FORM_ERROR`
- Prefixes for specific uses: `is*` for booleans (`isSubmitting`, `isValid`), `on*` for callbacks (`onChange`, `onSubmit`)

**Types:**
- PascalCase for interfaces and types: `FormElementProps`, `LabeledTextFieldProps`, `TestObject`
- Generic type parameters use uppercase single letters: `<E, V>`, `<T>`
- Type names are explicit and descriptive: `LoginFormProps` not just `Props`

## Code Style

**Formatting:**
- ESLint with TypeScript plugin for enforcing code quality
- File: `eslint.config.ts`
- Indentation: 4 spaces (observed in code)
- Line breaks: Unix-style (LF)
- Consistent spacing around operators and after colons

**Linting:**
- ESLint with configurations:
  - `@typescript-eslint/eslint-plugin` for TypeScript rules
  - `eslint-plugin-react` for React rules and JSX-runtime
  - `eslint-plugin-react-hooks` for React Hooks rules
  - `@next/eslint-plugin-next` for Next.js best practices
  - `eslint-plugin-import` for import organization
- Key rules enforced:
  - `ts/return-await: 2` - Return awaited promises
  - JSX runtime: automatic JSX transform without React import
  - React Hooks recommended rules (dependencies, rules of hooks)
  - Next.js core web vitals

**File Structure:**
- Test files ignored from linting: `.eslintrc.ts` has `ignores: ["test/**", ".test/**"]`
- Next.js build output ignored: `.next/*`

## Import Organization

**Order:**
1. External dependencies (blitz, next, react)
2. Third-party utilities (zod, clsx, date-fns)
3. Internal absolute imports using `@/` alias
4. Relative imports (used sparingly)

**Examples:**
```typescript
// External
import { resolver } from "@blitzjs/rpc"
import { AuthenticationError } from "blitz"
import db from "@/src/lib/db"
import { z } from "zod"

// Internal utilities
import { cn } from "@/src/lib/util/utils"
import getCurrentHousehold from "@/src/lib/model/household/queries/getCurrentHousehold"

// Relative (rare)
import { Login } from "../validations"
```

**Path Aliases:**
- `@/*` maps to project root: `@/src/...`, `@/test/...`
- Used consistently throughout codebase for absolute imports
- Configured in `tsconfig.json` and `vitest.config.ts`

## Error Handling

**Patterns:**
- Throw specific error types from blitz: `throw new AuthenticationError("message")`
- Try-catch blocks for async operations with potentially failing side-effects:
  ```typescript
  try {
      result = await SecurePassword.verify(user.hashedPassword, password)
  } catch {
      throw new AuthenticationError("The credentials provided are invalid.")
  }
  ```
- Validation using Zod `.parse()` method which throws on validation failure
- Form errors returned as object with `FORM_ERROR` key for form submission errors
- Middleware pipe pattern catches authorization issues before reaching resolver

**Context-based exceptions:**
- `AuthenticationError` for login/auth failures
- Validation errors from Zod schemas
- Generic application errors thrown and caught at handler level

## Logging

**Framework:** `console` object (no dedicated logger observed)

**Patterns:**
- Logging not extensively used in codebase (production code minimal logging)
- Error conditions are thrown rather than logged
- Test fixtures may include seed data logging for debugging
- ESLint rule `@typescript-eslint/no-explicit-any` sometimes disabled with comment `//eslint-disable-line` for complex cases

## Comments

**When to Comment:**
- Rare - code is generally self-documenting through naming
- Used for explaining non-obvious decisions:
  ```typescript
  // Global timeouts increased for heavy integration tests (e.g., Testcontainers + MySQL)
  // to avoid "Hook timed out in 10000ms" during container startup on CI/Windows.
  hookTimeout: 120_000
  ```
- Used in config files for clarifying non-obvious settings
- Disabled rules documented with comment: `//eslint-disable-line @typescript-eslint/no-explicit-any`

**JSDoc/TSDoc:**
- Not extensively used in codebase
- Type system (TypeScript) preferred over documentation comments
- Function signatures are explicit through parameters and return types

## Function Design

**Size:** 
- Functions kept concise (LoginForm component ~60 lines, query functions ~40 lines)
- Resolver pattern breaks down complex logic into middleware pipeline
- Separate utility functions for reusable logic

**Parameters:**
- Use object destructuring for multiple parameters
- Formik context preferred over prop drilling
- Resolver parameters follow pattern: `(params, ctx)` where ctx is request context
- Type parameters explicitly declared for generic functions: `<E, V>`, `<T>`

**Return Values:**
- Async functions return Promises of typed objects
- Queries return paginated results with shape: `{ items, hasMore, nextPage, count }`
- Mutations return created/updated entity
- Form handlers return error object or undefined for success
- Explicit return type annotations on exported functions

**Examples:**
```typescript
// Query return type
return {
    accounts,
    nextPage,
    hasMore,
    count
}

// Mutation return type
return user

// Form error return
return { [FORM_ERROR]: "Sorry, those credentials are invalid" }
```

## Module Design

**Exports:**
- Named exports for utilities and component interfaces
- Default exports for resolver mutations/queries
- Barrel pattern used minimally - explicit imports preferred
- Type-only exports used: `export type FormElementProps = { ... }`

**Barrel Files:**
- Not used extensively
- Explicit imports preferred: `import getCurrentHousehold from "@/src/lib/model/household/queries/getCurrentHousehold"`

**File Organization Pattern:**
- Entity-based directory structure: `src/lib/model/{entity}/{queries|mutations}/`
- Schemas co-located: `src/lib/model/{entity}/schemas.ts`
- Components co-located with related pages: `src/app/{route}/components/{ComponentName}.tsx`
- Shared components in: `src/lib/components/`

---

*Convention analysis: 2026-07-21*
