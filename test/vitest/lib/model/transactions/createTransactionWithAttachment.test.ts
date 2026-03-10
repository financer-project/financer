import { beforeEach, describe, expect, test, vi } from "vitest"
import createTransaction from "@/src/lib/model/transactions/mutations/createTransaction"
import getTransaction from "@/src/lib/model/transactions/queries/getTransaction"
import TestUtilityMock from "@/test/utility/TestUtilityMock"
import { TransactionType } from "@prisma/client"
import { DateTime } from "luxon"

// Mock fileStorage — real DB is used, but file system operations are stubbed
vi.mock("@/src/lib/util/fileStorage", () => ({
    readTempFile: vi.fn(),
    moveTempToAttachment: vi.fn(),
    saveAttachmentFile: vi.fn(),
    deleteFile: vi.fn(),
    ensureDirectoryExists: vi.fn()
}))

import { readTempFile, moveTempToAttachment } from "@/src/lib/util/fileStorage"

const BASE_INPUT = {
    accountId: "",      // filled per test
    categoryId: null,
    counterpartyId: null,
    type: TransactionType.EXPENSE,
    name: "Test Invoice",
    valueDate: DateTime.now().toJSDate(),
    description: null,
    amount: 150
} as const

describe("createTransaction — invoice attachment flow", () => {
    const util = TestUtilityMock.getInstance()

    beforeEach(async () => {
        await util.seedDatabase()
        vi.clearAllMocks()
    })

    test("creates a transaction without attachment when no tempFileId is provided", async () => {
        const input = { ...BASE_INPUT, accountId: util.getTestData().accounts.standard.id }
        const transaction = await createTransaction(input, util.getMockContext())

        expect(transaction.id).toBeDefined()
        expect(readTempFile).not.toHaveBeenCalled()

        const fetched = await getTransaction({ id: transaction.id }, util.getMockContext())
        expect(fetched.attachments).toHaveLength(0)
    })

    test("promotes temp file to attachment when tempFileId is provided", async () => {
        const tempFileId = "temp-abc-123"
        const fileName = "invoice.pdf"
        const finalPath = `data/transactions/txn-1/attachments/att-1/${fileName}`

        vi.mocked(readTempFile).mockReturnValue({
            buffer: Buffer.from("PDF content"),
            metadata: {
                originalName: fileName,
                mimeType: "application/pdf",
                size: 11,
                createdAt: new Date().toISOString()
            }
        })
        vi.mocked(moveTempToAttachment).mockResolvedValue(finalPath)

        const input = {
            ...BASE_INPUT,
            accountId: util.getTestData().accounts.standard.id,
            tempFileId,
            tempFileName: fileName
        }

        const transaction = await createTransaction(input, util.getMockContext())
        expect(transaction.id).toBeDefined()

        // readTempFile called with the given tempFileId
        expect(readTempFile).toHaveBeenCalledWith(tempFileId)

        // moveTempToAttachment called with transaction id
        expect(moveTempToAttachment).toHaveBeenCalledWith(
            tempFileId,
            transaction.id,
            expect.any(String)
        )

        // Attachment record created in DB
        const fetched = await getTransaction({ id: transaction.id }, util.getMockContext())
        expect(fetched.attachments).toHaveLength(1)
        expect(fetched.attachments[0].name).toBe(fileName)
        expect(fetched.attachments[0].type).toBe("application/pdf")
        expect(fetched.attachments[0].path).toBe(finalPath)
    })

    test("transaction is still created when temp file promotion fails", async () => {
        vi.mocked(readTempFile).mockImplementation(() => {
            throw new Error("Temp file not found")
        })

        const input = {
            ...BASE_INPUT,
            accountId: util.getTestData().accounts.standard.id,
            tempFileId: "missing-temp-id"
        }

        // Should NOT throw
        const transaction = await createTransaction(input, util.getMockContext())
        expect(transaction.id).toBeDefined()

        // But no attachment should have been created
        const fetched = await getTransaction({ id: transaction.id }, util.getMockContext())
        expect(fetched.attachments).toHaveLength(0)
    })

    test("strips tempFileId and tempFileName from persisted transaction data", async () => {
        vi.mocked(readTempFile).mockReturnValue({
            buffer: Buffer.from("content"),
            metadata: {
                originalName: "file.pdf",
                mimeType: "application/pdf",
                size: 7,
                createdAt: new Date().toISOString()
            }
        })
        vi.mocked(moveTempToAttachment).mockResolvedValue("some/path")

        const input = {
            ...BASE_INPUT,
            accountId: util.getTestData().accounts.standard.id,
            tempFileId: "temp-xyz",
            tempFileName: "file.pdf"
        }

        const transaction = await createTransaction(input, util.getMockContext())

        // The returned transaction object should not have tempFileId/tempFileName
        expect((transaction as Record<string, unknown>)["tempFileId"]).toBeUndefined()
        expect((transaction as Record<string, unknown>)["tempFileName"]).toBeUndefined()
    })
})
