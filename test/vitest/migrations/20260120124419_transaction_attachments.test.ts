import path from "node:path"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { fkExists, getColumn, runSqlFile, startMySql, stopMySql, tableExists } from "./_utils"

const root = path.resolve(__dirname, "../../../")
const initial = path.join(root, "src/lib/db/schema/migrations/20250924094054_initial_schema/migration.sql")
const migration1 = path.join(root, "src/lib/db/schema/migrations/20251217125154_household_sharing/migration.sql")
const migrationToTest = path.join(root, "src/lib/db/schema/migrations/20260120124419_transaction_attachments/migration.sql")

let db: Awaited<ReturnType<typeof startMySql>>

describe("migration: 20260120124419_transaction_attachments", () => {
    beforeAll(async () => {
        db = await startMySql()

        // 1) Create initial schema
        await runSqlFile(db.connection, initial)
        await runSqlFile(db.connection, migration1)

        // 2) Seed fixtures
        await db.connection.query(
            `INSERT INTO User (id, createdAt, updatedAt, firstName, lastName, email, role)
             VALUES ('user_test', NOW(3), NOW(3), 'Test', 'User', 'test.user@example.com', 'USER')`
        )
        await db.connection.query(
            `INSERT INTO Household (id, createdAt, updatedAt, name, currency)
             VALUES ('household_test', NOW(3), NOW(3), 'Test Household', 'USD')`
        )
        await db.connection.query(
            `INSERT INTO Account (id, createdAt, updatedAt, name, householdId)
             VALUES ('account_test', NOW(3), NOW(3), 'Test Account', 'household_test')`
        )
        await db.connection.query(
            `INSERT INTO Transaction (id, createdAt, updatedAt, valueDate, description, amount, accountId)
             VALUES ('transaction_test', NOW(3), NOW(3), NOW(3), 'Test Transaction', 100, 'account_test')`
        )

        // 3) Apply the migration under test
        await runSqlFile(db.connection, migrationToTest)
    })

    afterAll(async () => {
        await stopMySql(db)
    })

    it("creates Attachment table", async () => {
        const exists = await tableExists(db!.connection, "Attachment")
        expect(exists).toBe(true)
    })

    it("Attachment.id is VARCHAR(191) and PRIMARY KEY", async () => {
        const col = await getColumn(db!.connection, "Attachment", "id")
        expect(col?.DATA_TYPE).toBe("varchar")
        expect(col?.COLUMN_TYPE).toContain("191")
    })

    it("Attachment has all required columns with correct types", async () => {
        const createdAt = await getColumn(db!.connection, "Attachment", "createdAt")
        expect(createdAt?.DATA_TYPE).toBe("datetime")

        const updatedAt = await getColumn(db!.connection, "Attachment", "updatedAt")
        expect(updatedAt?.DATA_TYPE).toBe("datetime")

        const name = await getColumn(db!.connection, "Attachment", "name")
        expect(name?.DATA_TYPE).toBe("varchar")
        expect(name?.COLUMN_TYPE).toContain("191")

        const size = await getColumn(db!.connection, "Attachment", "size")
        expect(size?.DATA_TYPE).toBe("int")

        const type = await getColumn(db!.connection, "Attachment", "type")
        expect(type?.DATA_TYPE).toBe("varchar")
        expect(type?.COLUMN_TYPE).toContain("191")

        const pathCol = await getColumn(db!.connection, "Attachment", "path")
        expect(pathCol?.DATA_TYPE).toBe("varchar")
        expect(pathCol?.COLUMN_TYPE).toContain("191")

        const transactionId = await getColumn(db!.connection, "Attachment", "transactionId")
        expect(transactionId?.DATA_TYPE).toBe("varchar")
        expect(transactionId?.COLUMN_TYPE).toContain("191")
    })

    it("Attachment has foreign key to Transaction", async () => {
        const exists = await fkExists(
            db!.connection,
            "Attachment",
            "Attachment_transactionId_fkey"
        )
        expect(exists).toBe(true)
    })

    it("can insert an attachment linked to a transaction", async () => {
        await db!.connection.query(
            `INSERT INTO Attachment (id, createdAt, updatedAt, name, size, type, path, transactionId)
             VALUES ('attachment_test', NOW(3), NOW(3), 'receipt.pdf', 12345, 'application/pdf', '/uploads/receipt.pdf',
                     'transaction_test')`
        )

        const [rows] = await db!.connection.query(
            `SELECT COUNT(*) as c
             FROM Attachment
             WHERE id = 'attachment_test'`
        )
        expect((rows as any[])[0].c).toBe(1)
    })

    it("FK cascade from Transaction to Attachment works (ON DELETE CASCADE)", async () => {
        await db!.connection.query(
            `DELETE
             FROM Transaction
             WHERE id = 'transaction_test'`
        )

        const [rows] = await db!.connection.query(
            `SELECT COUNT(*) as c
             FROM Attachment
             WHERE transactionId = 'transaction_test'`
        )
        expect((rows as any[])[0].c).toBe(0)
    })
})
