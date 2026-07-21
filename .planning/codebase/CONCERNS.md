# Codebase Concerns

**Analysis Date:** 2026-07-21

## Security Issues

### Directory Traversal Vulnerabilities in File Upload

**Risk:** Critical - Allows arbitrary file creation outside intended directories

**Files Affected:**
- `src/lib/util/fileStorage.ts` (saveImportFile function, line 24-34)
- `src/lib/util/fileStorage.ts` (saveAttachmentFile function, line 44-52)
- `src/app/api/imports/upload/route.ts` (no validation of importId)

**Current Vulnerability:**
The `saveImportFile()` function uses `importId` directly in path construction without sanitization:
```typescript
const importDir = path.join(IMPORTS_DIR, importId)
```
An attacker could pass `importId="../../../malicious"` to write files outside the intended directory.

Similarly, `saveAttachmentFile()` uses the original `fileName` without sanitization:
```typescript
const filePath = path.join(attachmentDir, fileName)
```

**Recommendation:**
1. Sanitize and validate `importId` - only allow UUID format
2. Sanitize `fileName` - strip path separators and special characters using `path.basename()`
3. Use UUID-generated filenames instead of original filenames
4. Validate both parameters against whitelist patterns

---

### Insufficient File Upload Validation

**Risk:** High - Allows malicious file uploads

**Files Affected:**
- `src/app/api/imports/upload/route.ts` (no file type or size validation)
- `src/app/api/transactions/attachments/upload/route.ts` (partially implemented)

**Current State:**
- `/api/imports/upload` accepts ANY file type and size
- No file signature/magic byte validation
- No quota limits per import or user

**Recommendation:**
1. Add MAX_SIZE constant to imports/upload (recommend 10MB limit like avatars)
2. Whitelist allowed MIME types (text/csv, application/vnd.ms-excel, etc.)
3. Implement file signature validation (magic bytes)
4. Add rate limiting per user
5. Add per-user/household file upload quota

---

### Hard-Coded Credentials in Docker Configuration

**Risk:** Critical - Compromised production deployments

**Files Affected:**
- `docker-compose.yml` (lines 6, 8, 26, 29)
- `README.md` (lines 44-53 show example with hard-coded key)

**Current Issues:**
```yaml
DATABASE_URL: mysql://root:password@financer-db:3306/financer
SESSION_SECRET_KEY: 63f4945d921d599f27ae4fdf5bada3f1
MYSQL_ROOT_PASSWORD: password
MYSQL_PASSWORD: password
```

**Recommendation:**
1. Use environment variables or secrets management (.env files not in git)
2. Generate random SESSION_SECRET_KEY on deployment
3. Use Docker secrets or compose secrets feature for sensitive values
4. Update README with examples showing env variable usage only
5. Add .env.example with placeholders

---

### Exposed Database Port

**Risk:** Medium - Direct database access from host

**Files Affected:**
- `docker-compose.yml` (line 24: `"3306:3306"`)

**Current State:**
MySQL port is exposed on the host machine, allowing direct connections outside the Docker network.

**Recommendation:**
- Remove port mapping for production deployments
- Use only internal Docker network communication
- Document that connections should go through the application layer
- If external access needed, use SSH tunneling or secure proxy

---

### Missing Authentication on Import Upload Endpoint

**Risk:** High - Unauthorized file uploads

**Files Affected:**
- `src/app/api/imports/upload/route.ts` (no auth check)

**Current State:**
Unlike the avatar upload endpoint which calls `invoke(getCurrentUser)`, the import upload endpoint has no authentication validation.

**Recommendation:**
1. Add auth check: `const user = await invoke(getCurrentUser, null)`
2. Validate user has access to the household for this import
3. Log all file upload attempts for audit trail

---

## Tech Debt & Code Quality

### Schema Naming Typo

**Issue:** Prisma model has typo in model name

**Files Affected:**
- `src/lib/db/schema/transaction.prisma` (line 39: "TransactonTags" instead of "TransactionTags")
- `src/lib/db/schema/tag.prisma` (references TransactonTags)

**Impact:** Model name is misleading and error-prone

**Current Code (line 39):**
```typescript
model TransactonTags {  // Should be TransactionTags
    transactionId String
    transaction   Transaction @relation(name: "TransactionTags", fields: [transactionId], references: [id])
    ...
}
```

**Recommendation:**
Create migration to rename model to `TransactionTags`. Document as breaking change for schema version.

---

### Undefined Return Values in Environment Fallbacks

**Issue:** Functions return undefined when environment variables are unset

**Files Affected:**
- `src/app/blitz-server.ts` (getLogLevel function, lines 8-19)
- `src/lib/db/index.ts` (getLogDefinition function, lines 7-18)

**Current Code:**
```typescript
function getLogLevel() {
    switch (process.env.LOG_LEVEL) {
        case "DEBUG": return 2
        case "INFO": return 3
        case "WARNING": return 4
        case "ERROR": return 5
        // No default case - returns undefined!
    }
}
```

**Impact:** When LOG_LEVEL is not set or invalid, logger receives undefined, potentially causing runtime errors

**Recommendation:**
Add default case:
```typescript
default: return 3  // INFO level
```

---

### Excessive ESLint Disable Comments

**Issue:** Over 50 eslint-disable directives suggest type safety gaps

**Files Affected:**
Multiple files including:
- `src/lib/util/formatter/Formatter.ts`
- `src/lib/guard/hooks/useAuthorize.ts`
- `src/lib/components/common/form/MultiStepForm.tsx`
- `src/app/(internal)/categories/components/CategoryForm.tsx`

**Root Causes:**
- `@typescript-eslint/no-explicit-any` used extensively
- React hook dependency issues suppressed
- Empty type objects suppressed

**Recommendation:**
1. Systematically replace `any` with proper types
2. Fix dependency arrays in useEffect hooks
3. Create shared utility types for common patterns
4. Add eslint rule to limit disable comments per file

---

### Console Statements in Production Code

**Issue:** 59 console.log/error statements in src/ should use logging framework

**Files Affected:**
- All API routes and service files use `console.error()`

**Current Pattern:**
```typescript
console.error('Error uploading file:', error)
console.error("Error uploading avatar:", error)
console.error("Error submitting form:", error)
```

**Recommendation:**
1. Create centralized logger utility
2. Use structured logging (JSON format for production)
3. Replace all `console.*` with logger methods
4. Implement log levels (debug, info, warn, error)
5. Support log rotation for file-based logging

---

## Performance Bottlenecks

### In-Memory Data Filtering in getCategoryDistribution

**Issue:** All transactions loaded, then filtered in-memory

**Files Affected:**
- `src/lib/model/transactions/queries/getCategoryDistribution.ts` (lines 66-95)

**Current Code:**
```typescript
const transactions = await db.transaction.findMany({
    where: {
        account: { householdId: currentHousehold.id },
        valueDate: { gte: startDate, lte: endDate },
        OR: [{ categoryId: { in: categoryIDsToSelect } }, { categoryId: null }]
    }
    // No select or include - loads all fields
})

// Then filtered in JavaScript:
categoryTree.getChildren().forEach(category => {
    result.push({
        ...category.data,
        amount: transactions
            .filter(transaction => /* filter logic */)
            .reduce((amount, transaction) => amount + transaction.amount, 0)
    })
})
```

**Impact:** For large household with many transactions, loads entire dataset only to filter in memory

**Recommendation:**
1. Use database aggregation: `groupBy` with `_sum`
2. Remove unnecessary field selects
3. Add indexed queries on valueDate and categoryId
4. Implement pagination for large result sets

---

### Eager Loading of Relations in getTransactions

**Issue:** Includes many relations by default

**Files Affected:**
- `src/lib/model/transactions/queries/getTransactions.ts` (lines 42-49)

**Current Code:**
```typescript
include: {
    category: true,
    counterparty: true,
    account: true,
    tags: { include: { tag: true } },
    attachments: true,
    createdBy: true
}
```

**Impact:** Every transaction query loads all related entities. Potential N+1 problem if not handled by Prisma select optimization.

**Recommendation:**
1. Make relations optional via query parameter (e.g., `?include=tags,attachments`)
2. Use `select` instead of `include` to specify exact fields needed
3. Profile queries to verify Prisma batching optimization is working
4. Consider separating UI concerns - detail view loads all relations, list view loads minimal data

---

### Missing Database Indexes

**Issue:** Schema doesn't define indexes for common query patterns

**Files Affected:**
- `src/lib/db/schema/*.prisma` (all models)

**Common Query Patterns Without Indexes:**
- `valueDate` filtering in transaction queries
- `householdId` filtering across all entities
- `categoryId` lookups
- `createdAt` sorting
- User email lookups (for authentication)

**Recommendation:**
Add indexes in schema:
```prisma
model Transaction {
    @@index([valueDate])
    @@index([householdId])  // via account.householdId
    @@index([categoryId])
    @@index([createdAt])
}
```

---

## Scaling Limits

### Local Filesystem File Storage

**Issue:** Files stored on local filesystem with no distributed storage

**Files Affected:**
- `src/lib/util/fileStorage.ts`
- Data stored in `./data` directory

**Current Capacity:**
- Limited by disk space on single machine
- No replication or backup
- File operations are synchronous (can block event loop)

**Recommendation:**
1. Migrate to S3/cloud object storage
2. Implement async file operations
3. Add backup strategy
4. Consider CDN for file delivery

---

### Single-Instance Database Connection

**Issue:** EnhancedPrisma client created as singleton

**Files Affected:**
- `src/lib/db/index.ts`

**Current State:**
```typescript
const db = new EnhancedPrisma({...})
```

**Scaling Issue:**
- Connection pool limited to single instance
- No support for read replicas
- Concurrent connections will be bottleneck

**Recommendation:**
1. Implement connection pooling (PgBouncer for PostgreSQL or similar)
2. Plan for read replicas if moving to PostgreSQL
3. Implement connection timeout handling
4. Monitor connection pool usage

---

## Architectural Concerns

### Non-Standard Prisma Schema Organization

**Issue:** Schema split into multiple .prisma files instead of single schema.prisma

**Files Affected:**
- `src/lib/db/schema/schema.prisma` (main, only datasource/generator)
- `src/lib/db/schema/*.prisma` (13 model files)
- Migrations location: `src/lib/db/schema/migrations/`

**Problems:**
- Not standard Prisma pattern
- May cause IDE tooling issues
- Difficult to see full schema at once
- Build process must concatenate files

**Recommendation:**
1. Document the build process for combining schema files
2. Consider using standard single schema.prisma approach
3. Ensure tooling properly handles split schema
4. Add schema validation to build pipeline

---

### Overly Broad Path Alias Configuration

**Issue:** Path alias targets entire project root

**Files Affected:**
- `tsconfig.json` (line 30-32)

**Current Config:**
```json
"paths": {
    "@/*": ["./*"]
}
```

**Problem:** 
- Any import starting with @ resolves to any file in project
- No clear separation of concerns
- Can create circular dependencies

**Recommendation:**
```json
"paths": {
    "@/src/*": ["./src/*"],
    "@/public/*": ["./public/*"],
    "@/*": ["./*"]  // Last resort fallback
}
```

---

## Test Coverage Gaps

### API Route Error Handling Not Fully Tested

**Issue:** Generic error responses in API routes may not be properly tested

**Files Affected:**
- `src/app/api/*/route.ts` files
- Most routes return `{ error: 'Failed to...' }` on exceptions

**Recommendation:**
1. Add specific error test cases for each API route
2. Test error scenarios: missing params, invalid types, auth failures
3. Verify error messages don't leak sensitive info
4. Test timeout and resource exhaustion scenarios

---

### Missing Integration Tests for Complex Flows

**Issue:** Transaction import flow has multiple steps but limited integration tests

**Files Affected:**
- `src/lib/model/imports/mutations/startImport.ts`
- `src/lib/model/imports/services/importProcessor.ts`
- Import component tests

**Current Gap:** Import process involves:
1. Upload file
2. Parse CSV
3. Map columns
4. Create transactions
5. Update account balance

No test verifying complete end-to-end flow with real data.

**Recommendation:**
1. Create integration tests for import flow with sample CSV files
2. Test rollback behavior on partial failures
3. Verify balance calculations after import
4. Test with edge cases (empty files, malformed data, duplicates)

---

## Dependencies at Risk

### Version Constraints

**Issue:** Package.json has loose version constraints

**Files Affected:**
- `package.json`

**High-Risk Patterns:**
- `@blitzjs/*: ^2.2.1` - could get breaking changes in future 2.x versions
- `@radix-ui/*: ^1.1.x` - various minor versions may have incompatibilities

**Current Known Issues:**
- No audit performed recently
- Security patches may require rebuilds

**Recommendation:**
1. Run `npm audit` regularly
2. Use `npm audit fix` for security patches
3. Implement semantic versioning policy document
4. Set up automated dependency update checks (Dependabot)
5. Test major version upgrades in staging before production

---

### Custom Validation Adapter

**Issue:** zod-formik-adapter (2.0.0) is less maintained

**Impact:** Type conversions between Zod and Formik may have gaps

**Recommendation:**
1. Monitor package for security updates
2. Consider alternative: @hookform/resolvers (more active)
3. Add tests for complex validation scenarios
4. Document adapter limitations

---

## Missing Features / Incomplete Implementations

### No Rate Limiting

**Issue:** API endpoints lack rate limiting

**Affected Areas:**
- Login endpoint (brute force risk)
- File upload endpoints
- All RPC endpoints

**Recommendation:**
1. Implement rate limiting middleware
2. Use Redis for distributed rate limiting
3. Different limits for authenticated vs. anonymous users
4. Log repeated rate limit violations

---

### No Audit Logging

**Issue:** Financial transaction mutations not logged for compliance

**Files Affected:**
- All mutation files in `src/lib/model/*/mutations/`

**Impact:** Cannot track who made what changes and when

**Recommendation:**
1. Create audit log table in schema
2. Add middleware to log all mutations
3. Store: user, action, entity type, old values, new values, timestamp
4. Implement audit log viewer in admin UI

---

### No Data Retention Policy

**Issue:** No mechanism to delete old data or comply with privacy regulations

**Impact:** GDPR/CCPA compliance risk

**Recommendation:**
1. Implement soft deletes for sensitive data
2. Add data retention policy configuration
3. Create background job to purge old data
4. Implement user data export functionality
5. Add full user deletion with cascade option

---

## Fragile Areas

### Form State Management with Multiple Dependencies

**Issue:** Complex forms with many useEffect hooks and dependency arrays

**Files Affected:**
- `src/app/(internal)/categories/components/CategoryForm.tsx` (eslint-disable on line 33)
- `src/lib/components/common/form/elements/DatePicker.tsx` (complex dependencies)
- `src/lib/components/common/form/elements/FileUploadField.tsx`

**Risk:** Changes to form props may cause:
- Missed updates (missing dependencies)
- Infinite loops (incorrect dependencies)
- Stale closures

**Recommendation:**
1. Extract hooks into custom useFormField hook
2. Simplify form by breaking into smaller components
3. Use reducer pattern for complex form state
4. Add integration tests for form lifecycle

---

### Sidebar Generation Using Math.random()

**Issue:** Unpredictable behavior

**Files Affected:**
- `src/lib/components/ui/sidebar.tsx` (line 601)

**Current Code:**
```typescript
return `${Math.floor(Math.random() * 40) + 50}%` // eslint-disable-line react-hooks/purity
```

**Problem:** 
- Random value on each render causes hydration mismatch
- Violates React purity rules
- Width may change on every render

**Recommendation:**
1. Use consistent layout (remove random width)
2. If variable width needed, calculate based on deterministic criteria
3. Use CSS custom properties for width instead of inline styles

---

## Missing Error Context

### Generic Error Messages

**Issue:** API endpoints return minimal error information

**Examples:**
- `{ error: 'Failed to upload file' }` - no indication of what failed
- `{ error: 'Unauthorized' }` - doesn't explain why auth failed

**Impact:**
- Difficult debugging during development
- Poor user experience
- Potential security information leakage if too detailed

**Recommendation:**
1. Create error classification system
2. Return specific error codes for programmatic handling
3. Include error details only in non-production environments
4. Implement error telemetry to track common failures

---

## Summary Priorities

| Issue | Severity | Impact | Fix Effort |
|-------|----------|--------|-----------|
| Directory traversal in uploads | Critical | Data breach | Medium |
| Hard-coded credentials | Critical | Deployment compromise | Low |
| Missing auth on import upload | High | Unauthorized access | Low |
| Database indexes missing | High | Performance degradation | Medium |
| File storage on local disk | High | Scaling blocker | High |
| In-memory filtering | Medium | Memory issues at scale | Medium |
| Schema typo (TransactonTags) | Medium | Maintenance burden | Medium |
| Missing audit logging | Medium | Compliance risk | High |
| No rate limiting | Medium | Abuse risk | Low |
| ESLint disable comments | Low | Code quality | High |

---

*Concerns audit: 2026-07-21*
