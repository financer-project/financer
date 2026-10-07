# External Integrations

**Analysis Date:** 2026-07-21

## APIs & External Services

**Not Detected:**
- No third-party payment processing APIs (Stripe, PayPal, etc.)
- No third-party authentication providers (OAuth, OIDC, SAML)
- No external analytics services
- No external error tracking or monitoring services

## Data Storage

**Databases:**
- MySQL 9 (via Docker container or managed database)
  - Connection: `DATABASE_URL` environment variable
  - Format: `mysql://user:password@host:3306/database`
  - ORM: Prisma Client 6.19.2 (`@prisma/client`)
  - Migrations: Managed via Prisma migrations
  - Seeding: TypeScript seed script at `prisma/seed.ts`

**Caching:**
- Redis (Alpine Linux via Docker)
  - Connection: `REDIS_URL` environment variable
  - Format: `redis://host:6379`
  - Client: ioredis 5.9.3
  - Use cases:
    - BullMQ job queue (import jobs, transaction templates)
    - Session storage (via Blitz.js)
    - Transient data caching
  - Configuration: Append-only file (AOF) persistence enabled

**File Storage:**
- Local filesystem only
  - Attachments stored in application data volume
  - No cloud storage integration (S3, Azure Blob, GCS)

## Job Queue & Background Processing

**Job Queue System:**
- BullMQ 5.70.1 - Redis-based job queue
  - Import Queue: `import-queue`
    - Processes CSV/file imports asynchronously
    - Job processor: `processImport()` in `src/lib/model/imports/services/importProcessor`
  - Transaction Templates Queue: `transaction-templates-queue`
    - Processes recurring transaction templates on schedule
    - Job processor: `processTransactionTemplates()` in `src/lib/model/transactionTemplates/services/templateProcessor`
    - Cron scheduling: Configurable time via admin settings (`transactionTemplateCronTime` in HH:mm format)

**Workers:**
- importWorker - Handles import processing jobs
- transactionTemplatesWorker - Handles scheduled transaction template processing
- Event handlers: completed, failed logging

## Email & Communication

**Email System:**
- Nodemailer 7.0.10 - SMTP email sending
  - Transporter: `getEmailTransporter()` in `src/lib/mailers/getEmailTransporter.ts`
  - Configuration: Stored in database (`AdminSettings`)
    - `smtpHost` - SMTP server hostname
    - `smtpPort` - SMTP port (default: 587)
    - `smtpUser` - SMTP username
    - `smtpPassword` - SMTP password
    - `smtpFromEmail` - Sender email address
    - `smtpFromName` - Sender display name
    - `smtpEncryption` - Encryption type: "none", "starttls", "tls"
  
**Email Templates:**
- Base template: `src/lib/mailers/templates/baseTemplate.ts`
- Forgot Password mailer: `src/lib/mailers/forgotPasswordMailer.ts`
- Invitation mailer: `src/lib/mailers/invitationMailer.ts`
- Test email endpoint: Admin settings allow sending test emails to verify SMTP configuration

**Email Use Cases:**
- Password reset notifications
- User invitations to households
- Account notifications
- Configurable via admin settings panel

## Authentication & Identity

**Auth Provider:**
- Custom authentication (no external OAuth/OIDC)
  - Framework: @blitzjs/auth 2.2.1
  - Password hashing: secure-password 4.0.0 (industry-standard PBKDF2-based)
  - Session management: Session-based (stored in Redis via Blitz)
  - Authorization: @blitz-guard/core 0.4.1 - Middleware-based role/permission system

**Security Settings:**
- Configurable token expiration:
  - Invitation tokens: Default 72 hours (1-7 days configurable)
  - Password reset tokens: Default 4 hours (1-24 hours configurable)
- Password reset flow: Email-based token verification
- Registration: Configurable (can be disabled by admins)

**Session Management:**
- Session storage: Redis via ioredis
- Session secret: `SESSION_SECRET_KEY` environment variable

## Monitoring & Observability

**Error Tracking:**
- Not detected - No external error tracking service

**Logging:**
- Console-based logging
  - Log level: Configured via `LOG_LEVEL` environment variable
  - Development: Verbose logging
  - Production: Info level and above
  - RPC endpoint: Verbose logging when `LOG_LEVEL=DEBUG`
  - Database: Query logging based on Prisma configuration

**Observability:**
- Custom logging in job workers (completed/failed events)
- Health check endpoint: `GET /api/health-check`
  - Returns: environment, version, timestamp

**Telemetry:**
- Next.js telemetry: Disabled via `NEXT_TELEMETRY_DISABLED=1`

## CI/CD & Deployment

**Hosting:**
- GitHub Container Registry (ghcr.io)
  - Image: `ghcr.io/financer-project/financer`
  - Tags: 
    - `dev` - Latest main branch build
    - `latest` - Latest release
    - `v*` - Semantic versioned releases

**CI Pipeline:**
- GitHub Actions
  - Build workflow: `.github/workflows/build.yml`
    - Trigger: Push to main, releases, manual dispatch
    - Jobs: Build and push Docker image to GHCR
    - Docker BuildKit: Enabled
    - Caching: GitHub Actions cache enabled

**Build & Deployment:**
- Docker multi-stage build: `Dockerfile`
  - Base: node:22-bullseye-slim
  - Stages: deps → builder → runner
  - Build command: `yarn build`
  - Runtime command: `npx prisma migrate deploy --schema=./db/schema && npx next start`
  - Port: 3000

**Local Development:**
- Docker Compose: `docker-compose.yml`
  - Services: Application, MySQL, Redis
  - Networks: Financer network
  - Volumes: Database persistence, Redis persistence, app data

## Environment Configuration

**Required env vars:**
- `DATABASE_URL` - MySQL connection string
- `REDIS_URL` - Redis connection string
- `SESSION_SECRET_KEY` - Session encryption key
- `NODE_ENV` - Environment (development/production/test)

**Optional env vars:**
- `LOG_LEVEL` - Logging verbosity (default: info)
- `DEMO_DATA` - Enable demo data (true/false)
- `APP_ORIGIN` - Application URL for email links
- `BLITZ_DEV_SERVER_ORIGIN` - Dev server URL (auto-detected typically)
- `PORT` - Server port (default: 3000)
- `HOSTNAME` - Server hostname (default: 0.0.0.0)

**Secrets location:**
- Environment variables via `.env` files (development)
- Docker environment variables (containers)
- GitHub secrets (CI/CD)
- Database AdminSettings table (SMTP configuration)

**.env Files:**
- `.env.local` - Local development configuration
- `.env.production` - Production build configuration
- `.env.test` - Test suite configuration

## Webhooks & Callbacks

**Incoming:**
- Not detected - No external webhook integrations

**Outgoing:**
- Not detected - No outgoing webhook support

## Data Formats & Serialization

**Import Formats:**
- CSV file support for transaction imports
  - Handled by: `src/lib/model/imports/services/importProcessor`
  - Processing: Async background job via BullMQ

**Data Validation:**
- Zod schemas for all input validation
- FormikAdapter for form-level validation
- TypeScript interfaces for type safety

**API Communication:**
- Blitz RPC for client-server communication
- JSON serialization for data transfer
- TypeScript type safety across the stack

---

*Integration audit: 2026-07-21*
