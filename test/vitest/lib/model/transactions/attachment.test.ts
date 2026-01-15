import { describe, expect, test, vi, beforeEach } from "vitest"
import addAttachment from "@/src/lib/model/transactions/mutations/addAttachment"
import deleteAttachment from "@/src/lib/model/transactions/mutations/deleteAttachment"
import getTransaction from "@/src/lib/model/transactions/queries/getTransaction"
import getTransactions from "@/src/lib/model/transactions/queries/getTransactions"
import TestUtilityMock from "@/test/utility/TestUtilityMock"
import { deleteFile } from "@/src/lib/util/fileStorage"

// Mock fileStorage
vi.mock("@/src/lib/util/fileStorage", () => ({
    deleteFile: vi.fn(),
    saveAttachmentFile: vi.fn(),
    ensureDirectoryExists: vi.fn(),
}))

describe("Attachment Mutations & Queries", () => {
    const util = TestUtilityMock.getInstance()

    beforeEach(async () => {
        await util.seedDatabase()
        vi.clearAllMocks()
    })

    describe("addAttachment", () => {
        test("adds an attachment to a transaction successfully", async () => {
            const transactionId = util.getTestData().transactions.standard.income.id
            const attachmentData = {
                id: "f47ac10b-58cc-4372-a567-0e02b2c3d471",
                transactionId: transactionId,
                name: "test-attachment.pdf",
                size: 1024,
                type: "application/pdf",
                path: "data/attachments/test-attachment.pdf"
            }

            const result = await addAttachment(attachmentData, util.getMockContext())

            expect(result.id).toBe(attachmentData.id)
            expect(result.name).toBe(attachmentData.name)
            expect(result.transactionId).toBe(transactionId)

            // Verify it's in the database
            const transaction = await getTransaction({ id: transactionId }, util.getMockContext())
            expect(transaction.attachments).toHaveLength(1)
            expect(transaction.attachments[0].id).toBe(attachmentData.id)
        })
    })

    describe("deleteAttachment", () => {
        test("deletes an attachment successfully", async () => {
            const transactionId = util.getTestData().transactions.standard.income.id
            const attachmentData = {
                id: "f47ac10b-58cc-4372-a567-0e02b2c3d472",
                transactionId: transactionId,
                name: "to-be-deleted.pdf",
                size: 2048,
                type: "application/pdf",
                path: "data/attachments/to-be-deleted.pdf"
            }

            // First add it
            await addAttachment(attachmentData, util.getMockContext())

            // Then delete it
            const result = await deleteAttachment({ id: attachmentData.id }, util.getMockContext())

            expect(result.id).toBe(attachmentData.id)
            expect(deleteFile).toHaveBeenCalledWith(attachmentData.path)

            // Verify it's gone from the database
            const transaction = await getTransaction({ id: transactionId }, util.getMockContext())
            expect(transaction.attachments).toHaveLength(0)
        })

        test("throws error if attachment not found", async () => {
            await expect(async () => {
                await deleteAttachment({ id: "f47ac10b-58cc-4372-a567-0e02b2c3d473" }, util.getMockContext())
            }).rejects.toThrow("Attachment not found")
        })
    })

    describe("queries", () => {
        test("getTransaction includes attachments", async () => {
            const transactionId = util.getTestData().transactions.standard.income.id
            const attachmentData = {
                id: "f47ac10b-58cc-4372-a567-0e02b2c3d474",
                transactionId: transactionId,
                name: "query-test.pdf",
                size: 512,
                type: "application/pdf",
                path: "data/attachments/query-test.pdf"
            }

            await addAttachment(attachmentData, util.getMockContext())

            const transaction = await getTransaction({ id: transactionId }, util.getMockContext())
            expect(transaction.attachments).toBeDefined()
            expect(transaction.attachments).toHaveLength(1)
            expect(transaction.attachments[0].name).toBe("query-test.pdf")
        })

        test("getTransactions includes attachments", async () => {
            const transactionId = util.getTestData().transactions.standard.income.id
            const householdId = util.getTestData().households.standard.id
            
            await addAttachment({
                id: "f47ac10b-58cc-4372-a567-0e02b2c3d475",
                transactionId: transactionId,
                name: "multi-test.pdf",
                size: 256,
                type: "application/pdf",
                path: "data/attachments/multi-test.pdf"
            }, util.getMockContext())

            const { transactions } = await getTransactions({ householdId }, util.getMockContext())
            const transactionWithAttachment = transactions.find(t => t.id === transactionId)
            
            expect(transactionWithAttachment).toBeDefined()
            expect(transactionWithAttachment?.attachments).toBeDefined()
            expect(transactionWithAttachment?.attachments.length).toBeGreaterThan(0)
            expect(transactionWithAttachment?.attachments[0].name).toBe("multi-test.pdf")
        })
    })
})
