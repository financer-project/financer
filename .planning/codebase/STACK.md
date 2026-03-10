# Technology Stack

**Analysis Date:** 2026-03-10

## Languages

**Primary:**
- TypeScript 5.9.3 - All source code, including application logic, API routes, and tests

**Secondary:**
- JavaScript - Build configuration and some tooling files

## Runtime

**Environment:**
- Node.js 22 (based on Dockerfile: `node:22-bullseye-slim`)
- Browser (React 19.2.4 for frontend)

**Package Manager:**
- Yarn 4.13.0 (locked in `packageManager` field in `package.json`)
- Lockfile: `yarn.lock` (present)

## Frameworks

**Core Framework:**
- Blitz.js 2.2.1 - Full-stack JavaScript framework built on Next.js
  - `@blitzjs/next` 2.2.1 - Next.js integration
  - `@blitzjs/rpc` 2.2.1 - RPC layer for client-server communication
  - `@blitzjs/auth` 2.2.1 - Authentication and session management

**Frontend:**
- Next.js 15.5.12 - React framework with App Router
- React 19.2.4 - UI library
- React DOM 19.2.4 - DOM rendering

**UI Component Library:**
- Radix UI (multiple components) - Unstyled, composable component library
  - Includes: alert-dialog, avatar, checkbox, dialog, dropdown-menu, label, popover, progress, scroll-area, select, separator, slider, slot, switch, tabs, toast, tooltip

**Styling:**
- Tailwind CSS 4.2.1 - Utility-first CSS framework
- PostCSS 8.5.6 - CSS transformation
- `@tailwindcss/postcss` 4.2.1 - PostCSS plugin for Tailwind
- Autoprefixer 10.4.22 - CSS vendor prefixes
- `class-variance-authority` 0.7.1 - Type-safe component style composition

**Forms & Validation:**
- Formik 2.4.6 - Form state management
- Zod 4.1.12 - TypeScript-first schema validation
- `zod-formik-adapter` 2.0.0 - Bridge between Zod and Formik

**Testing:**
- Vitest 3.2.4 - Unit and integration tests (replaces Jest)
- Cypress 15.10.0 - E2E and component tests
- `@cypress/code-coverage` 3.14.7 - Code coverage reporting for Cypress

**Build/Dev:**
- Blitz CLI - Development server and build tools
- Babel 7.22.0+ - JavaScript transpiler
- ESLint 9.39.1 - Code linting
- TypeScript ESLint 8.46.4 - TypeScript linting

## Key Dependencies

**Critical:**
- `@prisma/client` 6.19.2 - Database ORM for MySQL queries
- `prisma` 6.19.2 - Prisma CLI and schema tools
- `ioredis` 5.9.3 - Redis client for background jobs
- `bullmq` 5.70.1 - Job queue for background processing (uses Redis)
- `secure-password` 4.0.0 - Password hashing and verification

**Date/Time:**
- `date-fns` 4.1.0 - Modern date utility library
- `luxon` 3.6.0 - DateTime manipulation and formatting
- `react-day-picker` 8.10.1 - Date picker component

**Utilities:**
- `nodemailer` 7.0.10 - Email sending via SMTP
- `recharts` 2.15.3 - React charting library
- `react-easy-crop` 5.5.6 - Image cropping component
- `clsx` 2.1.1 - Conditional CSS class utility
- `tailwind-merge` 3.4.0 - Merge Tailwind classes intelligently
- `sonner` 2.0.7 - Toast notifications
- `cmdk` 1.1.1 - Command/search menu component
- `lucide-react` 0.544.0 - Icon library
- `next-themes` 0.4.6 - Theme provider and switching
- `currency-codes` 2.2.0 - ISO 4217 currency code lookups

**Authorization:**
- `@blitz-guard/core` 0.4.1 - Authorization/CASL integration

**Testing Utilities:**
- `@vitest/coverage-istanbul` 3.2.4 - Istanbul coverage provider for Vitest
- `jsdom` 27.2.0 - DOM implementation for testing
- `vitest-mock-extended` 3.1.0 - Extended mocking for Vitest
- `prisma-mock` 0.10.3 - Prisma client mocking for tests
- `@testcontainers/mysql` 11.12.0 - Testcontainers for MySQL in tests
- `@testcontainers/redis` 11.12.0 - Testcontainers for Redis in tests

**Coverage & Reporting:**
- `nyc` 17.1.0 - Test coverage reporting
- `@istanbuljs/nyc-config-typescript` 1.0.2 - Istanbul TypeScript configuration
- `lcov-result-merger` 5.0.1 - Merge coverage reports from multiple sources
- `babel-plugin-istanbul` 7.0.1 - Babel plugin for code instrumentation

## Database

**Primary Database:**
- MySQL 9+ (from `docker-compose.yml`)
- Provider: Prisma ORM (`@prisma/client`)
- Schema Location: `src/lib/db/schema/schema.prisma`
- Migrations: Prisma Migrate

## Caching & Background Jobs

**Cache/Queue:**
- Redis (Alpine, from `docker-compose.yml`)
- Client: `ioredis` 5.9.3
- Job Queue: `bullmq` 5.70.1 with Redis backend
- Use case: Background import jobs, transaction template scheduling

## Configuration

**Environment:**
- Managed via `.env` files (`.env`, `.env.local`, `.env.test`, `.env.production`)
- Loaded with `dotenv-cli` for npm scripts
- Key variables: `DATABASE_URL`, `REDIS_URL`, `NODE_ENV`, `LOG_LEVEL`, `APP_ORIGIN`, `SESSION_SECRET_KEY`

**Build:**
- `next.config.ts` - Next.js configuration with Blitz integration
- `tsconfig.json` - TypeScript compiler options (ES2024 target)
- `babel.config.js` - Babel configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `vitest.config.ts` - Vitest test runner configuration
- `cypress.config.ts` - Cypress E2E/component testing configuration
- `eslint.config.ts` - ESLint configuration
- `postcss.config.mjs` - PostCSS configuration
- `prisma.config.ts` - Prisma configuration

## Platform Requirements

**Development:**
- Node.js 22+
- Yarn 4.13.0
- MySQL 9+ (via Docker for local development)
- Redis (via Docker for local development)

**Production:**
- Docker container deployment
- Base image: `node:22-bullseye-slim`
- Requires: MySQL 9+ and Redis (external or containerized)

---

*Stack analysis: 2026-03-10*
