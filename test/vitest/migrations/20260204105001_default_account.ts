import path from "node:path"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { fkExists, getColumn, runSqlFile, startMySql, stopMySql } from "./_utils"

const root = path.resolve(__dirname, "../../../")
const initial = path.join(root, "src/lib/db/schema/migrations/20250924094054_initial_schema/migration.sql")
const migration1 = path.join(root, "src/lib/db/schema/migrations/20251217125154_household_sharing/migration.sql")
const migration2 = path.join(root, "src/lib/db/schema/migrations/20260120124419_transaction_attachments/migration.sql")
const migration3 = path.join(root, "src/lib/db/schema/migrations/20260130105551_user_profile/migration.sql")
const migrationToTest = path.join(root, "src/lib/db/schema/migrations/20260205000000_default_account/migration.sql")

let db: Awaited<ReturnType<typeof startMySql>>

describe("migration: 20260204105001_default_account", () => {
    beforeAll(async () => {
        db = await startMySql()

        // 1) Create initial schema and apply previous migrations
        await runSqlFile(db.connection, initial)
        await runSqlFile(db.connection, migration1)
        await runSqlFile(db.connection, migration2)
        await runSqlFile(db.connection, migration3)

        // 2) Seed fixtures - create user, household, membership, and account
        await db.connection.query(
            `INSERT INTO User (id, createdAt, updatedAt, firstName, lastName, email, role)
             VALUES ('test_user', NOW(3), NOW(3), 'Test', 'User', 'test@example.com', 'USER')`
        )
        await db.connection.query(
            `INSERT INTO Household (id, createdAt, updatedAt, name, currency, createdById)
             VALUES ('household_test', NOW(3), NOW(3), 'Test Household', 'USD', 'test_user')`
        )
        await db.connection.query(
            `INSERT INTO HouseholdMembership (id, createdAt, userId, householdId, role)
             VALUES ('membership_test', NOW(3), 'test_user', 'household_test', 'OWNER')`
        )
        await db.connection.query(
            `INSERT INTO Account (id, createdAt, updatedAt, name, householdId)
             VALUES ('account_test', NOW(3), NOW(3), 'Test Account', 'household_test')`
        )

        // 3) Apply the migration under test
        await runSqlFile(db.connection, migrationToTest)
    })

    afterAll(async () => {
        await stopMySql(db)
    })

    // Schema tests
    it("adds defaultAccountId column to HouseholdMembership", async () => {
        const col = await getColumn(db!.connection, "HouseholdMembership", "defaultAccountId")
        expect(col?.DATA_TYPE).toBe("varchar")
        expect(col?.COLUMN_TYPE).toContain("191")
        expect(col?.IS_NULLABLE).toBe("YES")
    })

    it("HouseholdMembership has foreign key to Account for defaultAccountId", async () => {
        const exists = await fkExists(
            db!.connection,
            "HouseholdMembership",
            "HouseholdMembership_defaultAccountId_fkey"
        )
        expect(exists).toBe(true)
    })

    it("existing memberships have null defaultAccountId", async () => {
        const [rows] = await db!.connection.query(
            `SELECT defaultAccountId FROM HouseholdMembership WHERE id = 'membership_test'`
        )
        expect((rows as any[])[0].defaultAccountId).toBeNull()
    })

    it("can set defaultAccountId on a membership", async () => {
        await db!.connection.query(
            `UPDATE HouseholdMembership SET defaultAccountId = 'account_test' WHERE id = 'membership_test'`
        )

        const [rows] = await db!.connection.query(
            `SELECT defaultAccountId FROM HouseholdMembership WHERE id = 'membership_test'`
        )
        expect((rows as any[])[0].defaultAccountId).toBe("account_test")
    })

    it("deleting account sets defaultAccountId to null (ON DELETE SET NULL)", async () => {
        // First ensure the default is set
        await db!.connection.query(
            `UPDATE HouseholdMembership SET defaultAccountId = 'account_test' WHERE id = 'membership_test'`
        )

        // Create a new account to delete
        await db!.connection.query(
            `INSERT INTO Account (id, createdAt, updatedAt, name, householdId)
             VALUES ('account_to_delete', NOW(3), NOW(3), 'Account to Delete', 'household_test')`
        )

        // Set it as the default
        await db!.connection.query(
            `UPDATE HouseholdMembership SET defaultAccountId = 'account_to_delete' WHERE id = 'membership_test'`
        )

        // Verify it's set
        let [rows] = await db!.connection.query(
            `SELECT defaultAccountId FROM HouseholdMembership WHERE id = 'membership_test'`
        )
        expect((rows as any[])[0].defaultAccountId).toBe("account_to_delete")

        // Delete the account
        await db!.connection.query(`DELETE FROM Account WHERE id = 'account_to_delete'`)

        // Verify defaultAccountId is now null
        ;[rows] = await db!.connection.query(
            `SELECT defaultAccountId FROM HouseholdMembership WHERE id = 'membership_test'`
        )
        expect((rows as any[])[0].defaultAccountId).toBeNull()
    })
})
