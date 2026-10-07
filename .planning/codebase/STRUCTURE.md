# Codebase Structure

**Analysis Date:** 2026-07-21

## Directory Layout

```
financer-blitz/
├── src/                           # All source code
│   ├── app/                       # Next.js app directory (pages + API routes)
│   │   ├── (auth)/                # Authentication routes (login, signup, password reset)
│   │   ├── (internal)/            # Authenticated application routes
│   │   ├── api/                   # API endpoints for health checks and webhooks
│   │   ├── layout.tsx             # Root layout with BlitzProvider
│   │   ├── error.tsx              # Global error boundary
│   │   ├── blitz-server.ts        # Blitz server configuration and plugins
│   │   ├── blitz-client.ts        # Blitz client configuration
│   │   ├── blitz-auth-config.ts   # Authentication configuration
│   │   └── globals.css            # Global styles
│   ├── lib/                       # Application core logic and components
│   │   ├── components/            # All React components
│   │   │   ├── ui/                # Radix UI + Tailwind primitives (Button, Dialog, etc.)
│   │   │   ├── common/            # Generic reusable components (DataTable, Forms, Dialog wrappers)
│   │   │   ├── content/           # Domain-specific component compositions
│   │   │   │   ├── page/          # Page layout components (PageHeader, PageTitle, etc.)
│   │   │   │   ├── nav/           # Navigation components (Sidebar, NavBar)
│   │   │   │   └── [domain]/      # Domain-specific (categories, counterparties, user, etc.)
│   │   │   └── provider/          # React Context providers (HouseholdProvider, AccountProvider, etc.)
│   │   ├── db/                    # Database layer
│   │   │   └── schema/            # Prisma schemas (split by domain)
│   │   │       ├── user.prisma    # User, Session, Token, Settings models
│   │   │       ├── household.prisma # Household, HouseholdMembership models
│   │   │       ├── account.prisma # Account model (belongs to household)
│   │   │       ├── transaction.prisma # Transaction, TransactionTags, TransactionType models
│   │   │       ├── category.prisma    # Category (household-scoped)
│   │   │       ├── tag.prisma         # Tag (household-scoped)
│   │   │       ├── counterparty.prisma # Counterparty (household-scoped)
│   │   │       ├── transactionTemplate.prisma # Recurring transaction templates
│   │   │       ├── import.prisma      # ImportJob, column/value mappings
│   │   │       ├── attachment.prisma  # File attachments to transactions
│   │   │       ├── adminSettings.prisma # Admin-level configuration
│   │   │       ├── migrations/        # Database migration history
│   │   │       └── schema.prisma  # Prisma config (datasource, generator)
│   │   ├── guard/                 # Authorization layer
│   │   │   ├── ability.ts         # CASL GuardBuilder with role-based rules
│   │   │   ├── hooks/             # React hooks for authorization checks
│   │   │   └── queries/           # Authorization-related queries
│   │   ├── model/                 # Business logic layer (Domain-Driven Design)
│   │   │   ├── auth/              # Authentication domain
│   │   │   │   ├── mutations/     # signupUser, loginUser, resetPassword
│   │   │   │   └── queries/       # getCurrentUser, getProfile
│   │   │   ├── household/         # Household domain
│   │   │   │   ├── mutations/     # createHousehold, updateHousehold, inviteUser
│   │   │   │   └── queries/       # getHousehold, getHouseholds, getCurrentHousehold
│   │   │   ├── account/           # Account domain
│   │   │   │   ├── mutations/     # createAccount, updateAccount, deleteAccount
│   │   │   │   └── queries/       # getAccount, getAccounts, getAccountBalance
│   │   │   ├── transactions/      # Transaction domain
│   │   │   │   ├── mutations/     # createTransaction, updateTransaction, deleteTransaction, deleteAttachment
│   │   │   │   ├── queries/       # getTransaction, getTransactions, getCategoryDistribution, etc.
│   │   │   │   ├── services/      # Complex transaction logic (data transformation, aggregations)
│   │   │   │   └── schemas.ts     # Zod validation schemas (CreateTransactionSchema, etc.)
│   │   │   ├── categories/        # Category domain
│   │   │   ├── tags/              # Tag domain
│   │   │   ├── counterparties/    # Counterparty domain
│   │   │   ├── imports/           # Import domain (CSV file processing)
│   │   │   │   ├── mutations/     # createImportJob, updateImportJob
│   │   │   │   ├── queries/       # getImportJob, getImportJobs
│   │   │   │   └── services/      # importProcessor.ts (CSV parsing, transaction creation)
│   │   │   ├── transactionTemplates/ # Recurring transaction templates
│   │   │   │   ├── mutations/
│   │   │   │   ├── queries/
│   │   │   │   └── services/      # templateProcessor.ts (scheduled execution)
│   │   │   ├── settings/          # User settings (theme, language)
│   │   │   ├── onboarding/        # Onboarding flow queries
│   │   │   ├── dashboard/         # Dashboard queries (summary stats)
│   │   │   └── common/            # Shared logic across domains
│   │   ├── hooks/                 # React hooks (useForm, useModal, etc.)
│   │   ├── jobs/                  # Background job processing (BullMQ + Redis)
│   │   │   ├── index.ts           # Import queue, transaction template queue setup
│   │   │   └── init.server.ts     # Initialize job workers on server start
│   │   ├── mailers/               # Email service
│   │   │   └── templates/         # Email templates (reset-password, invitation, etc.)
│   │   └── util/                  # Utilities
│   │       ├── formatter/         # Date, number, currency formatting
│   │       ├── zod/               # Zod helpers (getFindManySchema, etc.)
│   │       ├── utils.ts           # General utilities (cn for className merging, etc.)
│   │       └── fileStorage.ts     # File upload/download handling
│   ├── pages/                     # Legacy Next.js pages directory (.keep file only)
│   └── instrumentation.ts         # Application lifecycle hooks
├── prisma/
│   └── seed.ts                    # Database seed script
├── public/                        # Static assets
├── .env.example                   # Example environment variables
├── .env.local                     # Local development env vars (not committed)
├── .env.production                # Production env vars template
├── .env.test                      # Test environment configuration
├── next.config.ts                 # Next.js configuration
├── tsconfig.json                  # TypeScript configuration
├── package.json                   # Project dependencies and scripts
├── .eslintrc.js                   # ESLint configuration
├── .prettierrc                    # Prettier configuration
├── cypress.config.ts              # Cypress E2E test configuration
├── vitest.config.ts               # Vitest unit test configuration
├── tailwind.config.ts             # Tailwind CSS configuration
└── .planning/
    └── codebase/                  # Codebase analysis documents
```

## Directory Purposes

**`src/app/`** - Next.js app directory with pages and API routes
- Auth routes: Public pages (login, signup, password reset)
- Internal routes: Protected dashboard and feature pages
- API routes: Health checks, config, webhooks
- Layouts: Root layout with BlitzProvider, auth layout, internal layout with sidebar

**`src/app/(auth)/`** - Authentication flow
- Pages: `/login`, `/signup`, `/forgot-password`, `/reset-password`
- Components: Form components (LoginForm, SignupForm, etc.)
- Validations: Zod schemas for auth inputs

**`src/app/(internal)/`** - Authenticated application
- Contains: Dashboard, transactions, accounts, categories, household management, settings
- Protected: Uses BlitzLayout to ensure authentication
- Layout: Includes sidebar navigation, theme management

**`src/lib/components/`** - React component library
- `ui/`: Radix UI primitives with Tailwind styling
- `common/`: Generic components (DataTable with filtering/sorting, FormField wrapper, DialogContent, etc.)
- `content/`: Page-level and domain-specific compositions
- `provider/`: Context providers for shared data (no prop drilling)

**`src/lib/db/`** - Database layer with Prisma
- `schema/`: Modularized Prisma models by domain (one .prisma file per domain concept)
- Connection: MySQL via `DATABASE_URL` env var
- Client: Enhanced Prisma client with Blitz integration

**`src/lib/guard/`** - Authorization and access control
- Uses Blitz Guard (CASL) for role-based and resource-based permissions
- Two-tier roles: App-level (ADMIN/USER) and household-level (OWNER/ADMIN/MEMBER/GUEST)
- Used in: Every mutation via `Guard.authorizePipe()`, some queries

**`src/lib/model/`** - Business logic layer (core of application)
- Organized by bounded contexts (domains): auth, household, account, transactions, etc.
- Each domain has: `queries/` (read operations), `mutations/` (write operations), `schemas.ts` (Zod validation)
- Some domains have: `services/` (complex logic), `hooks/` (React hooks)
- Pattern: `resolver.pipe(validation → authorize → logic)`

**`src/lib/jobs/`** - Background job processing
- Setup: BullMQ queues and workers connected to Redis
- Queues: `import-queue` (CSV imports), `transaction-templates-queue` (scheduled transactions)
- Workers: Listen for jobs, process asynchronously, emit completion/failure events

**`src/lib/mailers/`** - Email service
- Uses Nodemailer
- Templates: Password reset, household invitation, etc.

**`src/lib/util/`** - Utility functions and helpers
- `formatter/`: Date (Luxon), number, currency formatting
- `zod/`: Reusable Zod validation patterns
- `fileStorage.ts`: Upload/download file handling
- `utils.ts`: General helpers (className merging, etc.)

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx` - Root HTML + BlitzProvider setup
- `src/app/(auth)/layout.tsx` - Auth routes wrapper
- `src/app/(internal)/layout.tsx` - Authenticated app with sidebar, performs onboarding check
- `src/app/blitz-server.ts` - Blitz RPC server initialization
- `src/app/blitz-client.ts` - Blitz RPC client initialization

**Configuration:**
- `next.config.ts` - Next.js build and runtime config
- `tsconfig.json` - TypeScript compiler options
- `tailwind.config.ts` - Tailwind CSS theme and plugins
- `.env.local` - Development environment variables (DATABASE_URL, REDIS_URL, etc.)
- `src/app/blitz-auth-config.ts` - Authentication strategy (onSuccess, onError callbacks)

**Core Logic:**
- `src/lib/model/[domain]/queries/*` - Read operations (decorated with @blitzjs/rpc resolver)
- `src/lib/model/[domain]/mutations/*` - Write operations
- `src/lib/guard/ability.ts` - Authorization rules (who can do what)
- `src/lib/db/index.ts` - Prisma client singleton with Blitz enhancement

**Testing:**
- `vitest.config.ts` - Unit test setup
- `cypress.config.ts` - E2E and component test setup
- `src/**/*.test.ts`, `src/**/*.spec.ts` - Test files (co-located with source)
- `.test/` directory - Generated coverage reports

## Naming Conventions

**Files:**
- `*.ts` or `*.tsx`: TypeScript source files
- `*.test.ts`, `*.spec.ts`: Test files (co-located next to source)
- `*.prisma`: Prisma schema files (one per domain)
- `route.ts`: Next.js API route handlers
- `page.tsx`: Next.js page components
- `layout.tsx`: Next.js layout wrapper components
- Components: PascalCase (`UserProfile.tsx`, `TransactionForm.tsx`)
- Utilities/functions: camelCase (`formatCurrency.ts`, `parseCSV.ts`)

**Directories:**
- `(name)`: Route group (not part of URL path) - e.g., `(auth)`, `(internal)`
- `[param]`: Dynamic route segment - e.g., `[householdId]`
- Domains: lowercase plural (`transactions`, `categories`, `accounts`)
- Component sections: `queries/`, `mutations/`, `services/`, `schemas.ts`

**Functions and Types:**
- Query functions: `get[Resource]()` - e.g., `getTransactions.ts`, `getCurrentHousehold.ts`
- Mutation functions: `[action][Resource]()` - e.g., `createTransaction.ts`, `updateAccount.ts`
- Services: descriptive verb noun - e.g., `importProcessor.ts`, `templateProcessor.ts`
- Schemas: `[ActionType][Resource]Schema` - e.g., `CreateTransactionSchema`, `UpdateHouseholdSchema`
- Abilities: lowercase verb - e.g., `create`, `read`, `update`, `delete`, `manage`

## Where to Add New Code

**New Feature (e.g., "Add currency conversion"):**
- **Primary code**: 
  - Query: `src/lib/model/transactions/queries/convertCurrency.ts` (if reading external rate data)
  - Mutation: `src/lib/model/transactions/mutations/convertTransaction.ts` (if modifying transactions)
  - Service: `src/lib/model/transactions/services/currencyConverter.ts` (business logic for conversion)
- **Schema**: `src/lib/model/transactions/schemas.ts` (add `ConvertTransactionSchema`)
- **Authorization**: `src/lib/guard/ability.ts` (add rule if new permissions needed)
- **Database**: `src/lib/db/schema/transaction.prisma` (add fields if schema changes required)
- **UI**: `src/app/(internal)/transactions/components/ConvertTransactionForm.tsx`
- **Tests**: `src/lib/model/transactions/mutations/convertTransaction.test.ts`, `src/app/(internal)/transactions/components/ConvertTransactionForm.spec.ts`

**New Domain (e.g., "Add budgets"):**
- Create directory: `src/lib/model/budgets/`
- Add subdirectories: `queries/`, `mutations/`, `services/` (if complex logic)
- Create schema file: `src/lib/db/schema/budget.prisma`
- Create schema validation: `src/lib/model/budgets/schemas.ts`
- Add authorization rules: Edit `src/lib/guard/ability.ts` → add household checking for budgets
- Create page: `src/app/(internal)/budgets/page.tsx`
- Create components: `src/app/(internal)/budgets/components/`
- Create jobs if async: `src/lib/jobs/index.ts` → add new queue

**New UI Component:**
- **Primitive**: `src/lib/components/ui/[ComponentName].tsx` (if reusable with Radix + Tailwind)
- **Feature**: `src/lib/components/common/[FeatureName]/` (if shared across features)
- **Domain-specific**: `src/lib/components/content/[domain]/[ComponentName].tsx`
- **Page layout**: `src/lib/components/content/page/` (PageHeader, PageTitle, etc.)

**New Utility:**
- **Formatter**: `src/lib/util/formatter/[domain].ts` (e.g., `currency.ts`, `date.ts`)
- **Zod helper**: `src/lib/util/zod/zodUtil.ts` (add to existing file)
- **General**: `src/lib/util/utils.ts` or create domain-specific (e.g., `csvParser.ts`)

**New Background Job:**
- **Define queue**: `src/lib/jobs/index.ts` → create Queue and Worker
- **Service logic**: `src/lib/model/[domain]/services/[jobName]Processor.ts`
- **Trigger**: Call `queue.add()` from mutation in `src/lib/model/[domain]/mutations/`
- **Initialization**: Job auto-starts via `src/lib/jobs/init.server.ts` (loaded by Next.js)

**New API Endpoint:**
- Location: `src/app/api/[path]/route.ts`
- Pattern: Next.js route handler (GET, POST, etc.)
- If internal logic: Call RPC resolvers via `invoke()` (see `src/app/(internal)/layout.tsx` for pattern)

## Special Directories

**`src/lib/db/schema/migrations/`** - Database migration history
- Generated by Prisma: `npx prisma migrate dev`
- Committed to git: Yes
- Not edited manually: Changes via Prisma schema → migration generated

**`.test/`** - Generated coverage reports
- Generated by: Vitest and Cypress
- Committed: No (in `.gitignore`)
- Contents: Istanbul/NYC coverage JSON, HTML reports

**`node_modules/`** - Installed dependencies
- Generated by: yarn/npm install
- Committed: No
- Managed by: `package.json` + lockfile

**`.next/`** - Next.js build output
- Generated by: `npm run build` or `yarn build`
- Committed: No (in `.gitignore`)
- Deleted safely: `rm -rf .next` (will rebuild on next dev/build)

**`public/`** - Static assets
- Committed: Yes
- Served at: `/` in URLs (e.g., `public/logo.png` → `GET /logo.png`)

---

*Structure analysis: 2026-07-21*
