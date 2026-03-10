# INTEGRATIONS

External services, APIs, and infrastructure integrations.

---

## Database

**MySQL 9+** via Prisma ORM
- Connection: `DATABASE_URL` env var
- Client: `src/lib/db/index.ts` (singleton PrismaClient)
- Schema: split across `src/lib/db/schema/*.prisma`, merged in `schema.prisma`
- Migrations: `src/lib/db/schema/migrations/`
- Config: `prisma.config.ts`

---

## Cache / Queue

**Redis** + **BullMQ**
- Used for: background job processing (CSV import pipeline)
- Connection: `REDIS_URL` env var
- Job definitions: `src/lib/jobs/index.ts`
- Server init: `src/lib/jobs/init.server.ts`
- Queue triggered via: `src/app/api/jobs/route.ts`
- Documentation: `src/lib/jobs/README.md`

---

## Authentication

**Blitz.js Auth** (session-based, cookie)
- Config: `src/app/blitz-auth-config.ts`
- Server: `src/app/blitz-server.ts`
- Client: `src/app/blitz-client.ts`
- RPC route: `src/app/api/rpc/[[...blitz]]/route.ts`
- No OAuth/SSO providers currently

---

## Email

**Nodemailer** (SMTP)
- Transporter: `src/lib/mailers/getEmailTransporter.ts`
- Config: `SMTP_*` env vars (host, port, user, password)
- Mailers:
  - `src/lib/mailers/forgotPasswordMailer.ts`
  - `src/lib/mailers/invitationMailer.ts`
  - `src/lib/mailers/notificationMailer.ts`
- Templates: `src/lib/mailers/templates/baseTemplate.ts`

---

## File Storage

**Local filesystem** (no cloud storage)
- Utility: `src/lib/util/fileStorage.ts`
- Upload routes:
  - `src/app/api/imports/upload/route.ts`
  - `src/app/api/transactions/attachments/upload/route.ts`
  - `src/app/api/users/avatar/upload/route.ts`
- Download route: `src/app/api/transactions/attachments/download/[attachmentId]/route.ts`
- Avatar route: `src/app/api/users/avatar/[userId]/route.ts`

---

## Infrastructure

**Docker**
- `Dockerfile` — production image
- `docker-compose.yml` — production compose (app + MySQL + Redis)
- `docker/docker-compose.dev.yml` — development compose

**CI/CD**
- `.github/workflows/build.yml` — build pipeline
- `.github/workflows/ci.yml` — test/lint pipeline

---

## External APIs

None currently. All data is self-hosted and user-managed.

---

## Monitoring / Observability

- Health check: `src/app/api/health-check/route.ts`
- Config endpoint: `src/app/api/config/route.ts`
- Instrumentation: `src/instrumentation.ts` (Next.js instrumentation hook)
- SonarQube: `sonar-project.properties`
