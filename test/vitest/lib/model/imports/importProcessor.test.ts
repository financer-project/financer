import { describe, expect, test, vi, beforeEach, afterEach } from "vitest"
import { processImport } from "@/src/lib/model/imports/services/importProcessor"
import TestUtilityFactory from "@/test/utility/TestUtilityFactory"
import { ImportStatus, TransactionType } from "@prisma/client"
import * as fileStorage from "@/src/lib/util/fileStorage"

// Mock the fileStorage module
vi.mock("@/src/lib/util/fileStorage", () => ({
    readImportFile: vi.fn()
}))

describe("Import Processor", () => {
    const util = TestUtilityFactory.mock()

    const mockImportId = "mock-import-id"
    const mockFilePath = "mock/file/path.csv"
    const mockCsvContent =
        `header1,header2,header3,header4,header5
        value1,100.50,2023-04-28,account1,category1
        value2,-200.75,2023-04-29,account2,category2
        value3,300.25,2023-04-30,account1,category3
        value4,250,2023-04-31,unmapped,unmapped`

    // Setup mocks before each test
    beforeEach(async () => {
        await util.seedDatabase()

        // Mock the readImportFile function
        vi.mocked(fileStorage.readImportFile).mockReturnValue(mockCsvContent)

        // Create a mock import job
        await util.getDatabase().importJob.create({
            data: {
                id: mockImportId,
                name: "Test Import",
                status: ImportStatus.PENDING,
                filePath: mockFilePath,
                separator: ",",
                householdId: util.getTestData().households.standard.id,
                columnMappings: {
                    create: [
                        { csvHeader: "header1", fieldName: "name", format: null },
                        { csvHeader: "header2", fieldName: "amount", format: "comma" },
                        { csvHeader: "header3", fieldName: "valueDate", format: "yyyy-MM-dd" },
                        { csvHeader: "header4", fieldName: "accountIdentifier", format: null },
                        { csvHeader: "header5", fieldName: "categoryName", format: null }
                    ]
                },
                valueMappings: {
                    create: [
                        {
                            sourceValue: "account1",
                            targetType: "account",
                            targetId: util.getTestData().accounts.standard.id
                        },
                        {
                            sourceValue: "account2",
                            targetType: "account",
                            targetId: util.getTestData().accounts.standard.id
                        },
                        {
                            sourceValue: "category1",
                            targetType: "category",
                            targetId: util.getTestData().categories.standard.income.id
                        },
                        {
                            sourceValue: "category2",
                            targetType: "category",
                            targetId: util.getTestData().categories.standard.livingCosts.id
                        }
                    ]
                }
            }
        })
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    test("processes an import job successfully", async () => {
        // Process the import
        await processImport(mockImportId)

        // Verify the import job was updated
        const updatedImportJob = await util.getDatabase().importJob.findUnique({
            where: { id: mockImportId }
        })

        expect(updatedImportJob).not.toBeNull()
        expect(updatedImportJob?.status).toBe(ImportStatus.COMPLETED)
        expect(updatedImportJob?.totalRows).toBe(4)
        expect(updatedImportJob?.processedRows).toBe(4)

        // Verify transactions were created
        const transactions = await util.getDatabase().transaction.findMany({
            where: { importJobId: mockImportId }
        })

        expect(transactions).toHaveLength(3)

        // Verify first transaction (INCOME)
        const incomeTransaction = transactions.find(t => t.name === "value1")
        expect(incomeTransaction).toBeDefined()
        expect(incomeTransaction?.type).toBe(TransactionType.INCOME)
        expect(incomeTransaction?.amount).toBe(100.50)
        expect(incomeTransaction?.accountId).toBe(util.getTestData().accounts.standard.id)
        expect(incomeTransaction?.categoryId).toBe(util.getTestData().categories.standard.income.id)

        // Verify second transaction (EXPENSE)
        const expenseTransaction = transactions.find(t => t.name === "value2")
        expect(expenseTransaction).toBeDefined()
        expect(expenseTransaction?.type).toBe(TransactionType.EXPENSE)
        expect(expenseTransaction?.amount).toBe(200.75) // Negative for expense
        expect(expenseTransaction?.categoryId).toBe(util.getTestData().categories.standard.livingCosts.id)

        // Verify third transaction (TRANSFER)
        const transferTransaction = transactions.find(t => t.name === "value3")
        expect(transferTransaction).toBeDefined()
        expect(transferTransaction?.type).toBe(TransactionType.INCOME)
        expect(transferTransaction?.amount).toBe(300.25)
        expect(transferTransaction?.accountId).toBe(util.getTestData().accounts.standard.id)
    })

    test("handles errors during import processing", async () => {
        // Mock readImportFile to throw an error
        vi.mocked(fileStorage.readImportFile).mockImplementation(() => {
            throw new Error("Failed to read file")
        })

        // Process the import
        await processImport(mockImportId)

        // Verify the import job was updated with error status
        const updatedImportJob = await util.getDatabase().importJob.findUnique({
            where: { id: mockImportId }
        })

        expect(updatedImportJob).not.toBeNull()
        expect(updatedImportJob?.status).toBe(ImportStatus.FAILED)
        expect(updatedImportJob?.errorMessage).toBe("Failed to read file")
    })

    test("handles missing file path", async () => {
        // Update import job to have no file path
        await util.getDatabase().importJob.update({
            where: { id: mockImportId },
            data: { filePath: null }
        })

        // Process the import
        await processImport(mockImportId)

        // Verify the import job was updated with error status
        const updatedImportJob = await util.getDatabase().importJob.findUnique({
            where: { id: mockImportId }
        })

        expect(updatedImportJob).not.toBeNull()
        expect(updatedImportJob?.status).toBe(ImportStatus.FAILED)
        expect(updatedImportJob?.errorMessage).toBe("No file path to process")
    })

    test("skips rows without account mappings", async () => {
        // Update import job to remove the account2 mapping
        await util.getDatabase().importJob.update({
            where: { id: mockImportId },
            data: {
                valueMappings: {
                    deleteMany: {
                        sourceValue: "account2"
                    }
                }
            }
        })

        // Process the import
        await processImport(mockImportId)

        // Verify the import job was completed successfully
        const updatedImportJob = await util.getDatabase().importJob.findUnique({
            where: { id: mockImportId }
        })

        expect(updatedImportJob).not.toBeNull()
        expect(updatedImportJob?.status).toBe(ImportStatus.COMPLETED)

        // Verify transactions were created only for rows with account mappings
        const transactions = await util.getDatabase().transaction.findMany({
            where: { importJobId: mockImportId }
        })

        // We should have 2 transactions (for "account1" rows) instead of 3
        expect(transactions).toHaveLength(2)

        // Verify that only transactions with "account1" were created
        const transactionNames = transactions.map(t => t.name)
        expect(transactionNames).toContain("value1")
        expect(transactionNames).toContain("value3")
        expect(transactionNames).not.toContain("value2") // This row had "account2" which wasn't mapped
    })

    test("handles no account mappings", async () => {
        // Update import job to have no account mappings
        await util.getDatabase().importJob.update({
            where: { id: mockImportId },
            data: {
                valueMappings: {
                    deleteMany: {
                        targetType: "account"
                    }
                }
            }
        })

        // Process the import
        await processImport(mockImportId)

        // Verify the import job was completed successfully
        const updatedImportJob = await util.getDatabase().importJob.findUnique({
            where: { id: mockImportId }
        })

        expect(updatedImportJob).not.toBeNull()
        expect(updatedImportJob?.status).toBe(ImportStatus.COMPLETED)

        // Verify no transactions were created
        const transactions = await util.getDatabase().transaction.findMany({
            where: { importJobId: mockImportId }
        })

        // We should have 0 transactions since all rows were skipped
        expect(transactions).toHaveLength(0)
    })

    test("handles invalid account IDs", async () => {
        // Update import job to have invalid account IDs in the value mappings
        await util.getDatabase().importJob.update({
            where: { id: mockImportId },
            data: {
                valueMappings: {
                    updateMany: {
                        where: {
                            sourceValue: "account1"
                        },
                        data: {
                            targetId: "invalid-account-id"
                        }
                    }
                }
            }
        })

        // Process the import
        await processImport(mockImportId)

        // Verify the import job was completed successfully
        const updatedImportJob = await util.getDatabase().importJob.findUnique({
            where: { id: mockImportId }
        })

        expect(updatedImportJob).not.toBeNull()
        expect(updatedImportJob?.status).toBe(ImportStatus.COMPLETED)

        // Verify only transactions with valid account IDs were created
        const transactions = await util.getDatabase().transaction.findMany({
            where: { importJobId: mockImportId }
        })

        // We should have 1 transaction (for "account2") instead of 3
        expect(transactions).toHaveLength(1)
        expect(transactions[0].name).toBe("value2")
    })
})
