# Testing Patterns

**Analysis Date:** 2026-07-21

## Test Framework

**Runner:**
- Vitest 3.2.4 - Unit and integration tests
- Cypress 15.10.0 - Component and E2E tests
- Config: `vitest.config.ts` for unit tests, `cypress.config.ts` for component/e2e

**Assertion Library:**
- Vitest uses `expect()` (built-in, Jest-compatible API)
- Cypress uses `cy.should()` and `cy.expect()` for assertions
- Custom Cypress commands in `test/cypress/support/commands.ts`

**Run Commands:**
```bash
npm run test                          # Run all tests (unit + component + e2e + coverage merge)
npm run test:unit                     # Unit tests with coverage
npm run test:unit:watch               # Unit tests in watch mode
npm run test:component                # Component tests (Cypress)
npm run test:component:headed          # Component tests with visual output
npm run test:component:open            # Component test playground
npm run test:e2e                       # E2E tests (Cypress)
npm run test:e2e:headed                # E2E tests with visual output
npm run test:e2e:open                  # E2E test playground
```

## Test File Organization

**Location:**
- Unit tests: `test/vitest/` - mirrors src structure
- Component tests: `test/cypress/component/` - mirrors src component structure
- E2E tests: `test/cypress/e2e/`
- Test utilities: `test/utility/`
- Cypress support: `test/cypress/support/`
- Test fixtures: `test/seed/`

**Naming:**
- Unit tests: `{module}.test.ts` - Example: `signup.test.ts`, `account.test.ts`
- Component tests: `{ComponentName}.spec.tsx` - Example: `TextField.spec.tsx`, `DataTable.spec.tsx`
- E2E tests: `{feature}.spec.ts` - Example: `authentication.spec.ts`, `transactions.spec.ts`

**Structure:**
```
test/
├── vitest/                          # Unit tests mirror src structure
│   ├── lib/model/auth/
│   │   ├── signup.test.ts
│   │   └── auth/
│   │       └── login.test.ts
│   └── setup/
│       └── mock-prisma.ts           # Global test setup
├── cypress/
│   ├── component/                   # Component tests
│   │   └── common/form/elements/
│   │       └── TextField.spec.tsx
│   ├── e2e/                         # E2E tests
│   │   ├── authentication.spec.ts
│   │   └── transactions.spec.ts
│   ├── support/
│   │   ├── e2e.ts                   # E2E setup
│   │   ├── component.tsx            # Component setup
│   │   ├── commands.ts              # Custom commands
│   │   └── component-index.html
│   └── fixtures/                    # Test data fixtures
├── utility/
│   ├── TestUtility.ts               # Shared test utilities
│   ├── TestUtilityMock.ts           # Mock data provider
│   └── TestUtilityDBContainer.ts    # Database container
└── seed/                            # Database seed data
    ├── accounts.ts
    └── categorySeed.ts
```

## Test Structure

**Unit Test Suite Organization:**
```typescript
describe("Feature Name", () => {
    const utils = TestUtilityMock.getInstance()

    beforeEach(async () => {
        await utils.seedDatabase()
        vi.clearAllMocks()
        // Setup test-specific mocks
    })

    describe("Nested Context", () => {
        test("specific behavior", async () => {
            const mockCtx = utils.getMockContext()
            const result = await functionUnderTest(params, mockCtx)
            expect(result).toBeDefined()
        })
    })
})
```

**Patterns:**
- `beforeEach()` for setup - clears mocks and seeds database
- Nested `describe()` blocks for logical grouping
- Mix of `test()` and `it()` (both work with vitest)
- Async/await for async operations
- vi.mocked() for typed mock access
- vi.spyOn() for spying on existing functions

**E2E Test Suite Organization:**
```typescript
describe("Feature Name Spec", () => {
    let testData: TestData

    beforeEach(() => {
        cy.resetAndSeedDatabase((result) => {
            testData = result as TestData
            cy.visit("/")
        }, true)
    })

    after(() => {
        cy.task("resetDatabase", true)
    })

    it("user flow description", () => {
        cy.get("selector").click()
        cy.url().should("include", "/expected-path")
        cy.contains("Expected Text").should("exist")
    })
})
```

**Patterns:**
- `beforeEach()` for database reset and navigation
- `after()` for cleanup
- Cy.task() for server-side operations (database, token creation)
- cy.get() for DOM selection
- cy.should() for assertions
- Custom commands for complex interactions: `cy.selectField({ for: "currency", value: "Euro" })`

## Mocking

**Framework:** `vitest` - uses `vi.mock()` and `vi.spyOn()`

**Patterns:**
```typescript
// Mock entire module
vi.mock("@/src/lib/model/settings/queries/getAdminSettings", () => ({
    default: vi.fn().mockResolvedValue({
        allowRegistration: true
    })
}))

// Mock named export with actual implementation
vi.mock("@blitzjs/auth", async () => {
    const actual = await vi.importActual("@blitzjs/auth")
    return {
        ...actual,
        hash256: vi.fn().mockReturnValue("hashed-test-token")
    }
})

// Spy on and override database calls
vi.spyOn(db.token, "findFirst").mockResolvedValue(null)

// Access mocked function in test
vi.mocked(getAdminSettings).mockResolvedValueOnce({
    allowRegistration: true
} as any)
```

**What to Mock:**
- External services (auth, third-party APIs)
- Database operations (via db proxies)
- Security-sensitive operations (password hashing, token generation)
- System time and randomness (when relevant)
- File I/O and network requests

**What NOT to Mock:**
- Core business logic being tested
- Validation logic (Zod schemas tested directly)
- Helper utilities and formatters
- Constants and enum values

## Fixtures and Factories

**Test Data:**
```typescript
// From TestUtilityMock - provides mock context and test data
const utils = TestUtilityMock.getInstance()
const mockCtx = utils.getMockContext("none")  // "none" = no household
const testData = utils.getTestData()
const userId = testData.users.admin.id

// From Cypress - database seeding
cy.resetAndSeedDatabase((result) => {
    testData = result as TestData
}, true)
```

**Location:**
- Unit test: `test/utility/TestUtilityMock.ts` - provides mocked context
- E2E test: `test/cypress/support/e2e.ts` - registers cy.resetAndSeedDatabase()
- Seed data: `test/seed/` - scripts to populate database
- Database container: `test/utility/TestUtilityDBContainer.ts` - manages test database lifecycle

**Database Reset Pattern:**
- Vitest: `await utils.seedDatabase()` in beforeEach
- Cypress: `cy.resetAndSeedDatabase()` in beforeEach, `cy.task("resetDatabase", true)` in after

## Coverage

**Requirements:** 
- Coverage tracking enabled via Istanbul provider
- Reporters: text-summary, JSON, HTML, LCOV format
- No hard minimum enforced (monitor and improve incrementally)

**View Coverage:**
```bash
npm run test:unit              # Generates coverage in .test/unit/coverage/
npm run test                   # Merges all coverage into .test/lcov.info
# Open .test/unit/coverage/index.html in browser
```

**Coverage Configuration:**
- Vitest config: `vitest.config.ts` - includes coverage section
- NYC config: `nyc.config.js` - typescript support via `@istanbuljs/nyc-config-typescript`
- Include: `src/**/*.ts`, `src/**/*.tsx`
- Exclude: Next.js metadata (`page.tsx`, `layout.tsx`, `route.ts`), test files

## Test Types

**Unit Tests:**
- Scope: Individual functions, resolvers, queries, mutations
- Framework: Vitest
- Location: `test/vitest/`
- Timeout: 120 seconds (increased for integration tests with Testcontainers)
- Setup: Global setup file `test/vitest/setup/mock-prisma.ts` mocks Prisma

**Integration Tests:**
- Scope: Database interactions, multi-function flows, external service interactions
- Framework: Vitest with Testcontainers for MySQL, Redis
- Location: `test/vitest/` - mixed with unit tests, identified by .id.test.ts pattern
- Timeout: 120 seconds for hooks, 120 seconds for tests
- Uses: Real database containers started/stopped per test suite

**Component Tests:**
- Scope: React component rendering, user interactions, form validation
- Framework: Cypress component testing
- Location: `test/cypress/component/`
- Browser: Chrome by default
- Setup: `test/cypress/support/component.tsx` with Formik/Router context providers

**E2E Tests:**
- Scope: Complete user workflows, cross-feature interactions
- Framework: Cypress E2E
- Location: `test/cypress/e2e/`
- Setup: Real application startup, database seeding per test
- Browser: Chrome by default
- Base URL: `http://localhost:3000`
- Retries: 2 in run mode, 0 in open mode
- Timeouts: 20 seconds for requests and commands

## Common Patterns

**Async Testing:**
```typescript
// Vitest
test("async operation", async () => {
    const result = await asyncFunction()
    expect(result).toBeDefined()
})

// Cypress
it("async operation", () => {
    cy.get("button").click()
    cy.url().should("include", "/expected")  // Auto-waits for condition
})
```

**Error Testing:**
```typescript
// Vitest - toThrow
await expect(async () => signup({
    email: existingUser.email,
    password: "Password123!"
}, mockCtx)).rejects.toThrow()

// Vitest - specific error message
expect(() => {
    throw new Error("specific message")
}).toThrow("specific message")

// Cypress - should not exist
cy.contains("Error message").should("not.exist")
```

**Mock Verification:**
```typescript
// Verify function was called
expect(SecurePassword.hash).toHaveBeenCalledWith("password123")

// Verify with specific arguments
expect(db.token.findFirst).toHaveBeenCalledWith({
    where: {
        hashedToken: "hashed-test-token",
        type: { in: [TokenType.INVITATION, TokenType.INVITATION_HOUSEHOLD] },
        sentTo: "test@example.com",
        expiresAt: { gt: expect.any(Date) }
    }
})

// Verify partial object match
expect(result).toMatchObject({
    firstName: "Test",
    lastName: "User",
    email: "test@example.com"
})
```

**Database Testing:**
```typescript
// Unit test with mock database
vi.spyOn(db.user, "findFirst").mockResolvedValue(null)

// E2E test with real database
cy.task("createToken", {
    type: TokenType.INVITATION,
    email: "user@test.com",
    userId: testData.users.admin.id
}).then((result: any) => {
    const token = result.token
    cy.visit(`/signup?token=${token}`)
})
```

---

*Testing analysis: 2026-07-21*
