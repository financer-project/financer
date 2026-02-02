import path from "node:path"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { fkExists, getColumn, runSqlFile, startMySql, stopMySql } from "./_utils"

const root = path.resolve(__dirname, "../../../")
const initial = path.join(root, "src/lib/db/schema/migrations/20250924094054_initial_schema/migration.sql")
const migration1 = path.join(root, "src/lib/db/schema/migrations/20251217125154_household_sharing/migration.sql")
const migration2 = path.join(root, "src/lib/db/schema/migrations/20260120124419_transaction_attachments/migration.sql")
const migrationToTest = path.join(root, "src/lib/db/schema/migrations/20260130105551_user_profile/migration.sql")

let db: Awaited<ReturnType<typeof startMySql>>

describe("migration: 20260130105551_user_profile", () => {
    beforeAll(async () => {
        db = await startMySql()

        // 1) Create initial schema and apply previous migrations
        await runSqlFile(db.connection, initial)
        await runSqlFile(db.connection, migration1)
        await runSqlFile(db.connection, migration2)

        // 2) Seed fixtures - create user, household, membership (OWNER), account, and transaction
        await db.connection.query(
            `INSERT INTO User (id, createdAt, updatedAt, firstName, lastName, email, role)
             VALUES ('owner_user', NOW(3), NOW(3), 'Owner', 'User', 'owner@example.com', 'USER')`
        )
        await db.connection.query(
            `INSERT INTO User (id, createdAt, updatedAt, firstName, lastName, email, role)
             VALUES ('member_user', NOW(3), NOW(3), 'Member', 'User', 'member@example.com', 'USER')`
        )
        await db.connection.query(
            `INSERT INTO Household (id, createdAt, updatedAt, name, currency)
             VALUES ('household_test', NOW(3), NOW(3), 'Test Household', 'USD')`
        )
        await db.connection.query(
            `INSERT INTO HouseholdMembership (id, createdAt, userId, householdId, role)
             VALUES ('membership_owner', NOW(3), 'owner_user', 'household_test', 'OWNER')`
        )
        await db.connection.query(
            `INSERT INTO HouseholdMembership (id, createdAt, userId, householdId, role)
             VALUES ('membership_member', NOW(3), 'member_user', 'household_test', 'MEMBER')`
        )
        await db.connection.query(
            `INSERT INTO Account (id, createdAt, updatedAt, name, householdId)
             VALUES ('account_test', NOW(3), NOW(3), 'Test Account', 'household_test')`
        )
        await db.connection.query(
            `INSERT INTO Transaction (id, createdAt, updatedAt, valueDate, description, amount, accountId, name, type)
             VALUES ('transaction_test', NOW(3), NOW(3), NOW(3), 'Test Transaction', 100, 'account_test', 'Test', 'INCOME')`
        )
        await db.connection.query(
            `INSERT INTO Transaction (id, createdAt, updatedAt, valueDate, description, amount, accountId, name, type)
             VALUES ('transaction_test2', NOW(3), NOW(3), NOW(3), 'Test Transaction 2', 200, 'account_test', 'Test 2', 'EXPENSE')`
        )

        // 3) Apply the migration under test
        await runSqlFile(db.connection, migrationToTest)
    })

    afterAll(async () => {
        await stopMySql(db)
    })

    // Schema tests
    it("adds createdById column to Household", async () => {
        const col = await getColumn(db!.connection, "Household", "createdById")
        expect(col?.DATA_TYPE).toBe("varchar")
        expect(col?.COLUMN_TYPE).toContain("191")
        expect(col?.IS_NULLABLE).toBe("YES")
    })

    it("adds createdById column to Transaction", async () => {
        const col = await getColumn(db!.connection, "Transaction", "createdById")
        expect(col?.DATA_TYPE).toBe("varchar")
        expect(col?.COLUMN_TYPE).toContain("191")
        expect(col?.IS_NULLABLE).toBe("YES")
    })

    it("adds avatarPath column to User", async () => {
        const col = await getColumn(db!.connection, "User", "avatarPath")
        expect(col?.DATA_TYPE).toBe("varchar")
        expect(col?.COLUMN_TYPE).toContain("191")
        expect(col?.IS_NULLABLE).toBe("YES")
    })

    it("Household has foreign key to User for createdById", async () => {
        const exists = await fkExists(
            db!.connection,
            "Household",
            "Household_createdById_fkey"
        )
        expect(exists).toBe(true)
    })

    it("Transaction has foreign key to User for createdById", async () => {
        const exists = await fkExists(
            db!.connection,
            "Transaction",
            "Transaction_createdById_fkey"
        )
        expect(exists).toBe(true)
    })

    // Data migration tests
    it("migrates existing household createdById to the OWNER", async () => {
        const [rows] = await db!.connection.query(
            `SELECT createdById FROM Household WHERE id = 'household_test'`
        )
        expect((rows as any[])[0].createdById).toBe("owner_user")
    })

    it("migrates existing transaction createdById to the household OWNER", async () => {
        const [rows] = await db!.connection.query(
            `SELECT id, createdById FROM Transaction WHERE id IN ('transaction_test', 'transaction_test2') ORDER BY id`
        )
        const transactions = rows as any[]
        expect(transactions).toHaveLength(2)
        expect(transactions[0].createdById).toBe("owner_user")
        expect(transactions[1].createdById).toBe("owner_user")
    })

    it("does not assign createdById to MEMBER users", async () => {
        // Verify that member_user is not assigned as creator
        const [householdRows] = await db!.connection.query(
            `SELECT createdById FROM Household WHERE createdById = 'member_user'`
        )
        expect((householdRows as any[]).length).toBe(0)

        const [transactionRows] = await db!.connection.query(
            `SELECT createdById FROM Transaction WHERE createdById = 'member_user'`
        )
        expect((transactionRows as any[]).length).toBe(0)
    })
})
