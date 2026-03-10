# STRUCTURE

Directory layout, key file locations, and naming conventions.

---

## Top-Level Layout

```
financer/
├── src/                    # All application source code
│   ├── app/                # Next.js App Router pages & API routes
│   └── lib/                # Shared library code (model, components, utils)
├── test/                   # Integration test seeds and utilities
├── prisma/                 # Prisma seed (main seed.ts)
├── public/                 # Static assets (icons, favicon)
├── docker/                 # Docker dev compose
├── data/                   # Runtime data (file uploads, avatars)
├── .planning/              # GSD planning documents
├── .github/                # CI/CD workflows and issue templates
└── [config files]          # tsconfig, vitest, cypress, eslint, next.config, etc.
```

---

## src/app/ — Pages & API

```
src/app/
├── layout.tsx              # Root layout
├── page.tsx                # Root page (redirects to dashboard or login)
├── globals.css             # Global styles
├── manifest.ts             # PWA manifest
├── blitz-auth-config.ts    # Auth configuration
├── blitz-client.ts         # Blitz client setup
├── blitz-server.ts         # Blitz server setup
├── instrumentation.ts      # Next.js instrumentation
├── onboarding/             # Onboarding flow (first-time setup)
├── (auth)/                 # Auth route group (login, signup, password reset)
│   ├── login/
│   ├── signup/
│   ├── forgot-password/
│   ├── reset-password/
│   ├── components/         # Auth form components
│   └── validations.ts
├── (internal)/             # Protected app route group
│   ├── layout.tsx          # Internal layout (sidebar, nav)
│   ├── dashboard/          # Dashboard with charts and KPIs
│   ├── transactions/       # Transaction CRUD
│   ├── transaction-templates/ # Transaction templates
│   ├── accounts/           # (via households)
│   ├── households/         # Household and account management
│   ├── categories/         # Category management
│   ├── counterparties/     # Counterparty management
│   ├── tags/               # Tag management
│   ├── imports/            # CSV import wizard
│   └── settings/           # User and admin settings
└── api/
    ├── rpc/[[...blitz]]/   # Blitz.js RPC catch-all
    ├── health-check/       # Health check endpoint
    ├── config/             # Public config endpoint
    ├── jobs/               # BullMQ job trigger
    ├── imports/upload/     # CSV upload endpoint
    ├── transactions/attachments/ # Attachment upload/download
    └── users/avatar/       # Avatar upload/serve
```

---

## src/lib/ — Shared Library

```
src/lib/
├── model/                  # Business logic (queries, mutations, schemas)
│   ├── account/
│   ├── auth/
│   ├── categories/
│   ├── counterparties/
│   ├── dashboard/
│   ├── household/
│   ├── imports/
│   ├── onboarding/
│   ├── settings/
│   ├── tags/
│   ├── transactions/
│   ├── transactionTemplates/
│   └── user/
├── components/             # React components
│   ├── ui/                 # shadcn/ui primitives (button, input, dialog, etc.)
│   ├── common/             # App-level reusable components
│   │   ├── data/           # DataTable, DataItem, TreeView
│   │   ├── dialog/         # ConfirmationDialog
│   │   ├── form/           # Form wrapper + field elements
│   │   └── structure/      # Section, SectionSidebar, SectionContainer
│   ├── content/            # Domain-specific display components
│   │   ├── nav/sidebar/    # AppSidebar, NavHousehold, nav-user
│   │   ├── categories/     # ColoredTag
│   │   ├── counterparties/ # CounterpartyIcon
│   │   ├── page/           # PageComponents (header, breadcrumbs)
│   │   └── user/           # UserAvatar
│   └── provider/           # React context providers (Account, Category, etc.)
├── db/                     # Database client and Prisma schema
│   ├── index.ts            # PrismaClient singleton
│   ├── schema/             # Split Prisma schema files + migrations
│   └── seedDemoData.ts     # Demo data seeder
├── guard/                  # Authorization (CASL-based)
│   ├── ability.ts          # Ability definitions
│   ├── hooks/useAuthorize.ts
│   └── queries/authorizeAbility.ts
├── hooks/                  # Shared React hooks
├── jobs/                   # BullMQ job definitions + init
├── mailers/                # Email templates and transporter
└── util/                   # Utilities
    ├── fileStorage.ts
    ├── formatter/          # Amount, Date, Currency, FileSize formatters
    ├── utils.ts            # General utilities (cn, etc.)
    └── zod/zodUtil.ts      # Zod helpers
```

---

## Model Domain Structure

Each domain in `src/lib/model/` follows this pattern:

```
{domain}/
├── queries/        # Read operations (Blitz queries, exported as resolver functions)
├── mutations/      # Write operations (Blitz mutations)
├── schemas.ts      # Zod validation schemas
└── services/       # Complex business logic (optional)
```

---

## test/ — Integration Tests

```
test/
├── seed/           # Test data factories (accounts, transactions, categories, etc.)
└── utility/        # TestUtility, TestUtilityMock, TestUtilityDBContainer
```

Unit tests (`*.test.ts`) co-located with source files in `src/`.

---

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Files | camelCase or PascalCase | `getTransactions.ts`, `TransactionForm.tsx` |
| React components | PascalCase | `TransactionsList.tsx` |
| Hooks | camelCase, `use` prefix | `useCurrentUser.ts` |
| Queries | camelCase, `get` prefix | `getAccounts.ts` |
| Mutations | camelCase, verb prefix | `createAccount.ts`, `deleteTag.ts` |
| Schemas | `schemas.ts` per domain | `src/lib/model/account/schemas.ts` |
| Route groups | `(group-name)` | `(auth)`, `(internal)` |
| Dynamic segments | `[paramName]` | `[transactionId]`, `[householdId]` |
| Prisma schema | per-model `.prisma` files | `account.prisma`, `transaction.prisma` |

---

## Key Config Files

| File | Purpose |
|------|---------|
| `next.config.ts` | Next.js configuration |
| `tsconfig.json` | TypeScript config (path aliases: `@/*` → `src/*`) |
| `vitest.config.ts` | Unit/integration test config |
| `cypress.config.ts` | E2E test config |
| `eslint.config.ts` | ESLint flat config |
| `prisma.config.ts` | Prisma config (schema location) |
| `components.json` | shadcn/ui component config |
| `.env.development` | Dev environment overrides |
| `.env.test` | Test environment settings |
| `.env.production` | Production defaults |
