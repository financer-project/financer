import path from "node:path"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { getColumn, runSqlFile, startMySql, stopMySql } from "./_utils"

const root = path.resolve(__dirname, "../../../")
const initial = path.join(
    root,
    "src/lib/db/schema/migrations/20250924094054_initial_schema/migration.sql"
)
const migration = path.join(
    root,
    "src/lib/db/schema/migrations/20251217125154_household_sharing/migration.sql"
)

let db: Awaited<ReturnType<typeof startMySql>>

describe("migration: 20251217125154_household_sharing", () => {
    beforeAll(async () => {
        db = await startMySql()

        // 1) Create initial schema
        await runSqlFile(db.connection, initial)

        // 2) Seed fixtures
        await db.connection.query(
            `INSERT INTO User (id, createdAt, updatedAt, firstName, lastName, email, role)
             VALUES ('user_alice', NOW(3), NOW(3), 'Alice', 'Owner', 'alice.owner@example.com', 'USER')`
        )
        await db.connection.query(
            `INSERT INTO Household (id, createdAt, updatedAt, name, currency, ownerId)
             VALUES ('household_alice', NOW(3), NOW(3), 'Alice Household', 'USD', 'user_alice')`
        )
        // Pre-existing membership for the owner to test duplicate prevention
        await db.connection.query(
            `INSERT INTO HouseholdMembership (userId, householdId, role, accessLevel)
             VALUES ('user_alice', 'household_alice', 'ADMIN', 'FULL')`
        )

        await db.connection.query(
            `INSERT INTO User (id, createdAt, updatedAt, firstName, lastName, email, role)
             VALUES ('user_bob', NOW(3), NOW(3), 'Bob', 'Owner', 'bob.owner@example.com', 'USER')`
        )
        await db.connection.query(
            `INSERT INTO Household (id, createdAt, updatedAt, name, currency, ownerId)
             VALUES ('household_bob', NOW(3), NOW(3), 'Bob Household', 'EUR', 'user_bob')`
        )

        // 3) Apply the migration under test
        await runSqlFile(db.connection, migration)
    })

    afterAll(async () => {
        await stopMySql(db)
    })

    it("drops ownerId from Household", async () => {
        const col = await getColumn(db!.connection, "Household", "ownerId")
        expect(col).toBeUndefined()
    })

    it("adds OWNER role and backfills memberships when missing", async () => {
        const [rows] = await db!.connection.query(
            `SELECT COUNT(*) as c
             FROM HouseholdMembership
             WHERE householdId = 'household_bob'
               AND userId = 'user_bob'
               AND role = 'OWNER'`
        )
        expect((rows as any[])[0].c).toBe(1)
    })

    it("does not create a duplicate membership when one already exists", async () => {
        const [rows] = await db!.connection.query(
            `SELECT COUNT(*) as c
             FROM HouseholdMembership
             WHERE householdId = 'household_alice'
               AND userId = 'user_alice'`
        )
        expect((rows as any[])[0].c).toBe(1)
    })

    it("changes HouseholdMembership.id to VARCHAR(191)", async () => {
        const col = await getColumn(db!.connection, "HouseholdMembership", "id")
        expect(col?.DATA_TYPE).toBe("varchar")
        expect(col?.COLUMN_TYPE).toContain("191")
    })

    it("Token and AdminSettings changes exist", async () => {
        const [tokenTypeRows] = await db!.connection.query(
            `SELECT COLUMN_TYPE
             FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = 'Token'
               AND COLUMN_NAME = 'type'`
        )
        const typeStr = (tokenTypeRows as any[])[0].COLUMN_TYPE as string
        expect(typeStr).toContain("INVITATION_HOUSEHOLD")

        const contentCol = await getColumn(db!.connection, "Token", "content")
        expect(contentCol?.DATA_TYPE).toBe("json")

        const adminCol = await getColumn(
            db!.connection,
            "AdminSettings",
            "allowHouseholdAdminsToInviteUsers"
        )
        expect(adminCol?.DATA_TYPE).toBe("tinyint") // MySQL boolean
    })

    it("FK cascade from Household to HouseholdMembership works", async () => {
        await db!.connection.query(`DELETE
                                    FROM Household
                                    WHERE id = 'household_bob'`)
        const [rows] = await db!.connection.query(
            `SELECT COUNT(*) as c
             FROM HouseholdMembership
             WHERE householdId = 'household_bob'`
        )
        expect((rows as any[])[0].c).toBe(0)
    })
})
