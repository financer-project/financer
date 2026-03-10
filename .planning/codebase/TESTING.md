# Testing Patterns

**Analysis Date:** 2026-03-10

## Test Framework

**Runner:**
- Vitest 3.2.4 (unit/integration tests)
- Cypress 15.10.0 (E2E and component tests)
- Config: `vitest.config.ts`

**Assertion Library:**
- Vitest native: `describe`, `test`, `expect`
- Cypress native: `cy.expect()`, `cy.get()`, etc.

**Run Commands:**
```bash
npm run test                      # Run all tests (unit + component + e2e + coverage merge)
npm run test:unit               # Run unit tests with coverage
npm run test:unit:watch         # Watch mode for unit tests
npm run test:component          # Run Cypress component tests (headless)
npm run test:component:headed   # Run Cypress component tests (headed/visible)
npm run test:component:open     # Open Cypress component UI
npm run test:e2e                # Run Cypress E2E tests (headless)
npm run test:e2e:headed         # Run Cypress E2E tests (headed)
npm run test:e2e:open           # Open Cypress E2E UI for manual testing
npm run coverage:merge          # Merge coverage reports from all test types
```

## Test File Organization

**Location:**
- Unit tests: `test/vitest/lib/` (mirrors `src/lib/` structure)
- E2E tests: `test/cypress/e2e/`
- Utilities: `test/cypress/support/`, `test/utility/`
- Setup: `test/vitest/setup/`

**Naming:**
- Unit: `*.test.ts` (e.g., `counterparty.test.ts`)
- E2E: `*.spec.ts` (e.g., `authentication.spec.ts`)

**Structure:**
```
test/
├── vitest/
│   ├── lib/model/
│   │   ├── counterparty.test.ts
│   │   ├── tag.test.ts
│   │   └── imports/
│   │       ├── import.test.ts
│   │       └── importProcessor.test.ts
│   └── setup/
│       └── mock-prisma.ts
├── cypress/
│   ├── e2e/
│   │   ├── authentication.spec.ts
│   │   ├── accounts.spec.ts
│   │   └── ... (13+ other specs)
│   └── support/
│       ├── commands.ts
│       └── e2e.ts
└── utility/
    ├── TestUtility.ts
    ├── TestUtilityMock.ts (unit tests)
    └── TestUtilityDBContainer.ts (integration tests)
```

## Test Structure

**Suite Organization:**

```typescript
describe("Feature Name", () => {
    const util = TestUtilityMock.getInstance()

    beforeEach(async () => {
        await util.seedDatabase()
    })

    describe("operation type (get/create/update/delete)", () => {
        test("specific behavior", async () => {
            // Arrange - prepare test data
            const input = { /* ... */ }

            // Act - execute the function
            const result = await functionUnderTest(input, util.getMockContext())

            // Assert - verify results
            expect(result.field).toBe(expectedValue)
        })
    })
})
```

**Patterns:**
- **Setup:** `beforeEach()` seeds database with test data
- **Cleanup:** `afterEach()` clears mocks (vi.clearAllMocks())
- **Hierarchical describes:** Organize by operation type (get, create, update, delete)

**Example Structure (from counterparty.test.ts):**
```typescript
describe("Counterparty Mutations & Queries", () => {
    const util = TestUtilityMock.getInstance()

    beforeEach(async () => {
        await util.seedDatabase()
    })

    describe("get", () => {
        test("get all counterparties for a household", async () => { /* ... */ })
        test("get specific counterparty by ID", async () => { /* ... */ })
    })

    describe("create", () => {
        test("creates a new counterparty successfully", async () => { /* ... */ })
        test("creates with all fields", async () => { /* ... */ })
    })

    describe("update", () => {
        test("updates successfully", async () => { /* ... */ })
        test("fails to update non-existing", async () => { /* ... */ })
        test("fails cross-household update", async () => { /* ... */ })
    })

    describe("delete", () => {
        test("deletes successfully", async () => { /* ... */ })
        test("fails non-existing deletion", async () => { /* ... */ })
    })
})
```

## Mocking

**Framework:** vitest-mock-extended (v3.1.0)

**Patterns:**

**Global Mocks (vitest setup):**
```typescript
// test/vitest/setup/mock-prisma.ts
vi.mock("@/src/lib/db", async () => {
    const dbImport = await vi.importActual("@/src/lib/db")
    return {
        __esModule: true,
        ...dbImport,
        default: mockDeep()  // Prisma client mocked globally
    }
})

beforeEach(async () => {
    createPrismaMock({}, Prisma.dmmf.datamodel, db)
})
```

**Selective Mocks (per-test):**
```typescript
// Mock external services
vi.mock("@/src/lib/jobs", () => ({
    queueImportJob: vi.fn().mockResolvedValue(undefined)
}))

// Verify mock was called
vi.mocked(fileStorage.readImportFile).mockReturnValue(mockCsvContent)
expect(queueImportJob).toHaveBeenCalledWith(testImportJob.id)
```

**What to Mock:**
- External services: `vi.mock("@/src/lib/jobs")`
- File I/O: `fileStorage.readImportFile`
- Job queues and async tasks
- Email sending (mailed transports)
- Third-party APIs

**What NOT to Mock:**
- Database operations (use real Prisma mock via testcontainers setup)
- Core business logic (test it)
- Type validation (Zod runs for real)
- Authorization guards (test actual Guard logic)

## Fixtures and Factories

**Test Data:**
```typescript
// From TestUtilityMock - provides seeded test data
const util = TestUtilityMock.getInstance()
await util.seedDatabase()

// Access test data
const testData = util.getTestData()
testData.households.standard.id
testData.accounts.standard.id
testData.users.standard  // User object
testData.tags.standard.work.id
testData.counterparties.standard.merchant
```

**Test Data Structure:**
```typescript
{
    users: {
        standard: User,
        admin: User
    },
    households: {
        standard: { id, name, ... }
    },
    accounts: {
        standard: { id, householdId, ... }
    },
    categories: {
        standard: { income, livingCosts, ... }
    },
    tags: {
        standard: { work, personal, ... }
    },
    counterparties: {
        standard: { merchant, employer, utility, ... }
    }
}
```

**Location:**
- Base class: `test/utility/TestUtility.ts` (abstract TestUtilityBase)
- Mock implementation: `test/utility/TestUtilityMock.ts` (for unit tests)
- DB container implementation: `test/utility/TestUtilityDBContainer.ts` (for integration tests)

## Coverage

**Configuration (vitest.config.ts):**
- Provider: Istanbul
- Coverage enabled by default
- Reporters: text-summary, json, html, lcov
- Output directory: `.test/unit/coverage/`
- Includes: `src/**`
- Excludes: Pages, layouts, routes
- Extensions: `.ts`, `.tsx`

**Requirements:** None explicitly enforced, but coverage reports are generated

**View Coverage:**
```bash
npm run test:unit              # Coverage auto-generated
# View HTML report: .test/unit/coverage/index.html
```

**Coverage Merge:**
```bash
npm run coverage:merge         # Merges unit, component, E2E coverage
# Output: .test/lcov.info
```

## Test Types

**Unit Tests (Vitest):**
- **Scope:** Individual resolvers, mutations, queries, utilities
- **Approach:** Mock database via Prisma-mock, test business logic in isolation
- **File pattern:** `test/vitest/lib/**/*.test.ts`
- **Setup:** `TestUtilityMock` with seeded in-memory database
- **Timeouts:** 120 seconds (test), 120 seconds (hooks), 60 seconds (teardown)

**Component Tests (Cypress):**
- **Scope:** React components in isolation
- **Approach:** Mount component, interact, assert UI behavior
- **File pattern:** `test/cypress/**/*.spec.ts` (component mode)
- **Run mode:** `cypress run --component`
- **Coverage:** Via `@cypress/code-coverage` (NYC/Istanbul)

**E2E Tests (Cypress):**
- **Scope:** Full application workflows
- **Approach:** Real browser, real Next.js server, real database (seeded)
- **File pattern:** `test/cypress/e2e/*.spec.ts`
- **Run mode:** `cypress run --e2e`
- **Health check:** `localhost:3000/api/health-check` used to wait for server
- **Setup:** App started with `test:start:app` command using `.env.test`

## Common Patterns

**Async Testing:**
```typescript
test("async operation", async () => {
    const result = await resolverFunction(input, context)
    expect(result).toMatchExpectedValue()
})

// Error assertions with async
await expect(async () => updateEntity({...}, ctx)).rejects.toThrowError()
```

**Error Testing:**
```typescript
// Expect rejections
test("fails validation", async () => {
    await expect(async () =>
        createTag({ name: "ab" }, ctx)  // Too short
    ).rejects.toThrowError()
})

// Error message matching
test("custom error message", async () => {
    await expect(async () =>
        startImport({ id: "id" }, ctx)
    ).rejects.toThrowError(/Import job is already in PENDING state/)
})
```

**Authorization Testing:**
```typescript
// Test with different user roles
const adminContext = util.getMockContext("admin")
const userContext = util.getMockContext("standard")
const noAuthContext = util.getMockContext("none")  // Unauthenticated

const result = await getAccounts({}, adminContext)
await expect(async () =>
    deleteAccount({...}, noAuthContext)
).rejects.toThrowError()
```

**Cypress E2E Pattern:**
```typescript
describe("Feature", () => {
    beforeEach(() => {
        cy.resetAndSeedDatabase((testData) => {
            cy.visit("/")
        }, true)  // Reset users
    })

    after(() => {
        cy.task("resetDatabase", true)
    })

    it("user flow", () => {
        cy.loginWithUser(testData.users.standard)
        cy.get("selector").click()
        cy.url().should("include", "/expected-path")
    })
})
```

**Cypress Commands (helpers in commands.ts):**
- `cy.loginWithUser(user)` - Session-based login
- `cy.resetAndSeedDatabase(callback)` - Reset DB and seed test data
- `cy.selectField({ for, value })` - Unified select field interaction
- `cy.changeUser(user)` - Log out and log in as different user

**Database Integration (Testcontainers):**
```typescript
// test/vitest/lib/model/imports/importProcessor.test.ts
beforeEach(async () => {
    await util.seedDatabase()

    // Create test data directly for this test
    testImportJob = await util.getDatabase().importJob.create({
        data: { /* ... */ }
    })
})
```

## Notes

- **Global timeouts increased:** `hookTimeout: 120_000ms`, `testTimeout: 120_000ms` for heavy integration tests with Testcontainers
- **Session caching:** Cypress uses `cacheAcrossSpecs: true` to optimize login performance
- **Source maps:** Inline source maps enabled for debugging
- **Strict mode:** TypeScript configured with `strict: true`

---

*Testing analysis: 2026-03-10*
