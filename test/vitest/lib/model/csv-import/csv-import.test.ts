import { describe, beforeEach, test, afterEach, expect } from "vitest"
import TestUtilityMock from "@/test/utility/TestUtilityMock"
import fs from "node:fs"
import path from "node:path"
import db from "@/src/lib/db"
import createCSVImport from "@/src/lib/model/csv-import/mutations/createCSVImport"

describe("CSV Import", () => {
    const testCSV = "col1,col2\nval1,val2\nval3,val4\nval5,val6"
    let createdImportId: string | null = null
    let util: TestUtilityMock

    beforeEach(async () => {
        util = new TestUtilityMock()
        await util.seedDatabase()
    })

    describe("create", () => {

        test("creates a new CSV import, stores the file, and updates the database", async () => {
            const seededHouseholdId = util.getTestData().households.standard.id
            const input = {
                fileString: testCSV,
                originalFileName: "test.csv",
                householdId: seededHouseholdId
            }
            const ctx = util.getMockContext("standard")

            // Invoke the resolver that creates the CSV import record and stores the file
            const result = await createCSVImport(input, ctx)
            createdImportId = result.id

            // Assert the returned record has the expected values
            expect(result).toBeDefined()
            expect(result.originalFileName).toBe("test.csv")
            expect(result.userId).toBe(ctx.session.userId)
            expect(result.householdId).toBe(seededHouseholdId)
            expect(result.status).toBe("DRAFT")
            expect(result.columns).toEqual(["col1", "col2"])
            expect(result.rowCount).toBe(3)

            // Verify the record directly from the database
            const fromDb = await db.cSVImport.findUnique({ where: { id: result.id } })
            expect(fromDb).toBeDefined()
            expect(fromDb?.originalFileName).toBe("test.csv")

            // Verify that the CSV file has been stored correctly
            const importFolder = path.join(process.cwd(), "data", "imports", result.id)
            const filePath = path.join(importFolder, "import.csv")
            const fileExists = fs.existsSync(filePath)
            expect(fileExists).toBe(true)
            const fileContent = await fs.promises.readFile(filePath, "utf-8")
            expect(fileContent).toBe(testCSV)
        })

        test("throws an error when the CSV file is invalid", async () => {
            const invalidCSV = `col1,col2\n"badValue,val2`
            const seededHouseholdId = util.getTestData().households.standard.id
            const input = {
                fileString: invalidCSV,
                originalFileName: "invalid.csv",
                householdId: seededHouseholdId,
            }
            const ctx = util.getMockContext("standard")

            // The resolver should throw an error due to CSV parsing issues.
            await expect(createCSVImport(input, ctx)).rejects.toThrowError(/CSV parsing error/)
        })

        afterEach(async () => {
            if (createdImportId) {
                const importFolder = path.join(process.cwd(), "data", "imports", createdImportId)
                await fs.promises.rm(importFolder, { recursive: true, force: true })
                createdImportId = null
            }
        })
    })
})