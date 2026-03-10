# CONCERNS

Technical debt, known issues, and areas of concern.

---

## Critical Issues

### Non-standard ORM Usage
- **Location**: Various mutations using `deleteMany` instead of `delete` for single records
- **Risk**: Bypasses Prisma's built-in constraint checking
- **Impact**: Potential data integrity issues on bulk-style single deletes

### Typo in Model Name
- **Location**: Schema — `transactonTags` (missing 'i' in transaction)
- **Risk**: Confusing for developers; inconsistent naming
- **Impact**: Low functional risk but causes cognitive overhead

---

## Security Risks

### Unsafe HTML in Charts
- **Location**: `src/app/(internal)/dashboard/components/` — chart rendering
- **Risk**: Potential XSS if user-controlled data is injected into chart labels/tooltips
- **Action**: Sanitize all user-controlled strings before rendering in charts

### Missing CSV Validation
- **Location**: `src/lib/model/imports/services/importProcessor.ts`
- **Risk**: Malicious CSV files could exploit parser vulnerabilities
- **Action**: Validate file type, size, and content before processing

### Bulk Deletion Without Confirmation Guards
- **Location**: Multiple delete mutations
- **Risk**: Accidental data loss; no undo capability
- **Action**: Add soft delete or confirm-before-delete patterns for bulk operations

### Unvalidated Environment Variables
- **Location**: Various files reading `process.env.*` directly
- **Risk**: Silent failures or injection if env vars are misconfigured
- **Action**: Add env validation at startup (e.g., with zod or t3-env)

### Local File Storage
- **Location**: `src/lib/util/fileStorage.ts`
- **Risk**: No access control verification on served files beyond route-level auth; path traversal risk if filenames not sanitized
- **Action**: Validate filenames; consider signed URLs or access tokens

---

## Performance Bottlenecks

### Unoptimized Recurring Transaction Detection
- **Location**: `src/lib/model/transactions/services/recurringTransactionDetector.ts`
- **Risk**: In-memory pattern matching across all transactions — O(n²) potential
- **Impact**: Degrades with large transaction datasets
- **Action**: Add database-level filtering before in-memory analysis; add pagination

### Non-streaming Import Processing
- **Location**: `src/lib/model/imports/services/importProcessor.ts`
- **Risk**: Large CSV files loaded entirely into memory
- **Impact**: Memory exhaustion on large imports
- **Action**: Stream CSV parsing row-by-row

### N+1 Queries in Authorization
- **Location**: `src/lib/guard/queries/authorizeAbility.ts`
- **Risk**: Each request may re-fetch full household/membership context
- **Impact**: Extra DB roundtrips per request
- **Action**: Cache authorization context in session or use request-scoped memoization

### Dashboard Queries Unoptimized
- **Location**: `src/lib/model/dashboard/queries/getDashboardKPIs.ts`
- **Risk**: Complex aggregation queries on large transaction tables
- **Action**: Add database indexes on `date`, `accountId`, `householdId` combinations

---

## Technical Debt

### Large Component Files
- **Location**: `src/lib/components/content/nav/sidebar/AppSidebar.tsx` (~716 lines)
- **Debt**: Monolithic component mixing navigation, state, and rendering
- **Action**: Split into focused sub-components

### Inconsistent Error Handling in Imports
- **Location**: `src/lib/model/imports/` pipeline
- **Debt**: Error states not consistently propagated to UI; job failures may be silently swallowed
- **Action**: Standardize error reporting from BullMQ jobs to UI

### Weak Type Safety in Some Areas
- **Debt**: Some places use `any` or loose typing, particularly in import/CSV processing
- **Action**: Tighten types with proper generics or discriminated unions

### Missing Soft Delete
- **Debt**: All deletes are hard deletes with no audit trail or recovery
- **Action**: Consider soft delete pattern for critical data (transactions, accounts)

---

## Fragile Areas

### Import Job State Machine
- **Location**: `src/lib/model/imports/` + `src/app/(internal)/imports/components/ImportWizard.tsx`
- **Risk**: Complex multi-step wizard with BullMQ job polling; fragile if job state is lost or Redis restarts
- **Action**: Add job recovery/retry logic; persist job state to DB as backup

### Recurring Transaction Detection Algorithm
- **Location**: `src/lib/model/transactions/services/recurringTransactionDetector.ts`
- **Risk**: Heuristic-based detection with no test coverage; false positives/negatives common
- **Action**: Add comprehensive unit tests; document algorithm assumptions

### Sidebar State Management
- **Location**: `src/lib/components/content/nav/sidebar/AppSidebar.tsx`
- **Risk**: Complex local state managing collapsed/expanded sections, active routes
- **Action**: Simplify state; consider URL-driven navigation state

---

## Scaling Limits

### Single Redis Instance
- **Risk**: Single point of failure for all background jobs
- **Impact**: Import processing unavailable if Redis goes down
- **Action**: Add Redis sentinel or cluster for production

### Database Connection Pool Exhaustion
- **Risk**: PrismaClient singleton in `src/lib/db/index.ts` — no connection pool tuning
- **Impact**: Concurrent requests may exhaust MySQL connections
- **Action**: Configure connection pool limits; add connection pooling proxy (PgBouncer equivalent for MySQL)

### No Rate Limiting
- **Risk**: Auth endpoints, import uploads, and API routes have no rate limiting
- **Impact**: Brute force attacks, import abuse
- **Action**: Add rate limiting middleware at Next.js edge or reverse proxy level

---

## Test Coverage Gaps

### No Tests for Authorization Layer
- **Location**: `src/lib/guard/`
- **Risk**: Permission bugs could expose cross-household data

### No Tests for Import Pipeline
- **Location**: `src/lib/model/imports/services/importProcessor.ts`
- **Risk**: Silent regressions in CSV parsing/column mapping

### No Tests for Recurring Detection
- **Location**: `src/lib/model/transactions/services/recurringTransactionDetector.ts`
- **Risk**: Algorithm changes break detection without notice

### No Tests for Dashboard Queries
- **Location**: `src/lib/model/dashboard/queries/`
- **Risk**: KPI calculations silently wrong

### Limited E2E Coverage
- **Location**: Cypress tests in `test/`
- **Risk**: Core user workflows (import, recurring detection) not covered end-to-end

---

## Missing Features (Known Gaps)

| Feature | Impact |
|---------|--------|
| No audit logging | Can't trace who changed what |
| No transaction undo/history | Data loss on accidental delete |
| No data export (CSV/JSON) | Users can't extract their data |
| No rate limiting | Security vulnerability |
| No soft delete | No recovery from accidental deletes |
| No env validation at startup | Silent misconfiguration failures |

---

## Dependency Risks

### Blitz.js Framework Lock-in
- `@blitzjs/next` + `@blitzjs/rpc` ties RPC pattern to this framework
- Framework is less actively maintained than Next.js core
- **Action**: Monitor Blitz.js maintenance; plan migration path if needed

### Prisma Migration Complexity
- Split schema files require careful migration management
- `src/lib/db/schema/migrations/` must stay in sync with split schema
- **Action**: Document migration process; automate schema drift detection

### BullMQ Serialization
- Job data must be JSON-serializable; complex objects silently lose type information
- **Location**: `src/lib/jobs/index.ts`
- **Action**: Validate job payload types; add serialization tests
