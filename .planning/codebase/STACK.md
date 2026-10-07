# Technology Stack

**Analysis Date:** 2026-07-21

## Languages

**Primary:**
- TypeScript 5.9.3 - All source code files (.ts, .tsx)

**Secondary:**
- JavaScript - Build configuration, Node.js scripts

## Runtime

**Environment:**
- Node.js 22 (Debian bullseye-slim in Docker)

**Package Manager:**
- Yarn 4.12.0
- Lockfile: `yarn.lock` (present)

## Frameworks

**Core:**
- Blitz.js 2.2.1 - Full-stack React framework with RPC, authentication, and authorization
- Next.js 15.5.12 - React framework for production
- React 19.2.4 - UI component library

**Authentication & Authorization:**
- @blitzjs/auth 2.2.1 - Built-in authentication system
- @blitz-guard/core 0.4.1 - Authorization middleware
- secure-password 4.0.0 - Password hashing and verification

**UI Components & Styling:**
- Radix UI (multiple components: alert-dialog, avatar, checkbox, dialog, dropdown-menu, label, popover, progress, scroll-area, select, separator, slider, slot, switch, tabs, toast, tooltip)
- Tailwind CSS 4.2.1 - Utility-first CSS framework
- class-variance-authority 0.7.1 - Component variant system
- next-themes 0.4.6 - Theme management (light/dark)
- lucide-react 0.544.0 - SVG icon library

**Form & Validation:**
- Formik 2.4.6 - Form state management
- Zod 4.1.12 - TypeScript-first schema validation
- zod-formik-adapter 2.0.0 - Integration between Zod and Formik

**Data Visualization:**
- Recharts 2.15.3 - React charting library

**Date & Time:**
- date-fns 4.1.0 - Date utility library
- Luxon 3.6.0 - DateTime library with timezone support
- react-day-picker 8.10.1 - Day picker component

**Utilities:**
- clsx 2.1.1 - Conditional className utility
- cmdk 1.1.1 - Command palette component
- currency-codes 2.2.0 - Currency information library
- react-easy-crop 5.5.6 - Image cropping component
- tailwind-merge 3.4.0 - Merge Tailwind CSS classes safely
- sonner 2.0.7 - Toast notification library

## Key Dependencies

**Critical:**
- @prisma/client 6.19.2 - Database ORM client
- prisma 6.19.2 - Database schema and migration tool
- @blitzjs/rpc 2.2.1 - RPC system for client-server communication
- @blitzjs/next 2.2.1 - Blitz integration with Next.js

**Infrastructure & Jobs:**
- bullmq 5.70.1 - Job queue and worker system
- ioredis 5.9.3 - Redis client
- nodemailer 7.0.10 - Email sending library

**Development:**
- TypeScript-ESLint (@typescript-eslint/eslint-plugin@8.46.4, @typescript-eslint/parser@8.46.4) - TypeScript linting
- ESLint 9.39.1 - Code linting
- eslint-plugin-react 7.37.5 - React-specific linting rules
- eslint-plugin-react-hooks 7.0.1 - React Hooks linting
- eslint-plugin-import 2.32.0 - Import/export linting
- eslint-plugin-next (@next/eslint-plugin-next 15.5.12) - Next.js linting rules

## Testing

**Unit Testing:**
- Vitest 3.2.4 - Unit test runner
- @vitest/coverage-istanbul 3.2.4 - Code coverage
- vitest-mock-extended 3.1.0 - Extended mocking capabilities
- jsdom 27.2.0 - DOM simulation for Node.js tests
- prisma-mock 0.10.3 - Prisma client mocking

**E2E & Component Testing:**
- Cypress 15.10.0 - E2E and component testing framework
- @cypress/code-coverage 3.14.7 - Code coverage for Cypress

**Coverage Analysis:**
- nyc 17.1.0 - Code coverage reporting
- @istanbuljs/nyc-config-typescript 1.0.2 - Istanbul coverage for TypeScript
- lcov-result-merger 5.0.1 - Merge coverage reports

**Test Infrastructure:**
- start-server-and-test 2.1.2 - Start server before running E2E tests
- @testcontainers/mysql 11.12.0 - MySQL test container
- @testcontainers/redis 11.12.0 - Redis test container
- testcontainers 11.12.0 - Container management for testing
- mysql2 3.11.3 - MySQL driver (for testing)

## Build & Dev Tools

**Build System:**
- Webpack 5 (bundled with Next.js)
- Babel 7.22.0 (preset: next/babel)
- babel-loader 10.0.0 - Webpack Babel loader
- babel-plugin-istanbul 7.0.1 - Istanbul coverage for Babel
- @vitejs/plugin-react 5.1.1 - Vite React plugin
- vite-tsconfig-paths 5.1.4 - Vite tsconfig path resolution

**TypeScript:**
- TypeScript 5.9.3 - Language compiler
- tsx 4.21.0 - TypeScript execution runtime

**CSS:**
- PostCSS 8.5.6 - CSS transformation
- autoprefixer 10.4.22 - CSS vendor prefixing
- @tailwindcss/postcss 4.2.1 - Tailwind CSS PostCSS plugin
- tw-animate-css 1.4.0 - Tailwind animation utilities

**Development CLI:**
- dotenv-cli 10.0.0 - Load environment variables from .env files
- @next/env 15.5.12 - Next.js environment configuration

## Configuration

**Environment:**
- Environment variables via `.env`, `.env.local`, `.env.test`, `.env.production`
  - `DATABASE_URL` - MySQL connection string
  - `REDIS_URL` - Redis connection string
  - `NODE_ENV` - Development/production environment
  - `LOG_LEVEL` - Logging verbosity (DEBUG, etc.)
  - `DEMO_DATA` - Enable demo data seeding
  - `APP_ORIGIN` - Application origin URL for email links
  - `BLITZ_DEV_SERVER_ORIGIN` - Dev server origin
  - `SESSION_SECRET_KEY` - Session encryption key
  - `NEXT_TELEMETRY_DISABLED` - Disable Next.js telemetry

**Build Configuration:**
- `tsconfig.json` - TypeScript configuration with path aliases (@/*)
- `next.config.ts` - Next.js build configuration with SWC transforms, Webpack externals (bullmq, secure-password, @prisma/client)
- `cypress.config.ts` - E2E/component testing configuration
- `vitest.config.ts` - Unit testing configuration
- `eslint.config.ts` - ESLint configuration (TypeScript, React, Next.js plugins)
- `postcss.config.mjs` - PostCSS configuration with Tailwind
- `babel.config.js` - Babel configuration with Istanbul for testing
- `nyc.config.js` - NYC coverage configuration
- `.yarnrc.yml` - Yarn package manager configuration

## Database

**Primary:**
- MySQL 9 - Relational database (via Prisma)
- Prisma Client 6.19.2 - Database query and migration framework

**Connection:**
- Provider: MySQL
- Connection via `DATABASE_URL` environment variable
- Prisma client generator creates `@prisma/client`

## Caching & Sessions

**Redis:**
- Redis Alpine (via Docker) - In-memory data store
- ioredis 5.9.3 - Redis client library
- Used for: BullMQ job queue, session storage
- Connection via `REDIS_URL` environment variable

## Platform Requirements

**Development:**
- Node.js 22+
- Yarn 4.12.0+
- Docker & Docker Compose (for local MySQL and Redis)
- MySQL 9 (development container)
- Redis (development container)

**Production:**
- Docker container with Node.js 22
- MySQL 9 (managed database or container)
- Redis (managed cache or container)
- GitHub Container Registry (ghcr.io) for image hosting
- Port 3000 exposed for application

**Build Artifacts:**
- `.next/` - Next.js compiled application
- `node_modules/` - Dependencies
- Generated Prisma client in `.prisma/client/`

---

*Stack analysis: 2026-07-21*
