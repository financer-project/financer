import { describe, expect, test, vi, beforeEach } from "vitest"
import deleteAttachment from "@/src/lib/model/transactions/mutations/deleteAttachment"
import getTransaction from "@/src/lib/model/transactions/queries/getTransaction"
import getTransactions from "@/src/lib/model/transactions/queries/getTransactions"
import TestUtilityMock from "@/test/utility/TestUtilityMock"
import { deleteFile } from "@/src/lib/util/fileStorage"
import db from "@/src/lib/db"

// Mock fileStorage
vi.mock("@/src/lib/util/fileStorage", () => ({
    deleteFile: vi.fn(),
    saveAttachmentFile: vi.fn(),
    ensureDirectoryExists: vi.fn()
}))

describe("Attachment Mutations & Queries", () => {
    const util = TestUtilityMock.getInstance()

    beforeEach(async () => {
        await util.seedDatabase()
        vi.clearAllMocks()
    })

    // Helper function to create an attachment directly in the database
    const createTestAttachment = async (data: {
        id: string
        transactionId: string
        name: string
        size: number
        type: string
        path: string
    }) => {
        return db.attachment.create({
            data: {
                id: data.id,
                name: data.name,
                size: data.size,
                type: data.type,
                path: data.path,
                transaction: {
                    connect: { id: data.transactionId }
                }
            }
        })
    }

    describe("deleteAttachment", () => {
        test("deletes an attachment successfully", async () => {
            const transactionId = util.getTestData().transactions.standard.income.id
            const attachmentData = {
                id: "f47ac10b-58cc-4372-a567-0e02b2c3d472",
                transactionId: transactionId,
                name: "to-be-deleted.pdf",
                size: 2048,
                type: "application/pdf",
                path: "data/transactions/test/attachments/to-be-deleted.pdf"
            }

            // Create attachment directly in database
            await createTestAttachment(attachmentData)

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

        test("throws error if user is not authorized", async () => {
            const transactionId = util.getTestData().transactions.standard.income.id
            const attachmentData = {
                id: "f47ac10b-58cc-4372-a567-0e02b2c3d474",
                transactionId: transactionId,
                name: "unauthorized-delete.pdf",
                size: 1024,
                type: "application/pdf",
                path: "data/transactions/test/attachments/unauthorized-delete.pdf"
            }

            // Create attachment directly in database
            await createTestAttachment(attachmentData)

            // Try to delete with unauthenticated context
            await expect(async () => {
                await deleteAttachment({ id: attachmentData.id }, util.getMockContext("none"))
            }).rejects.toThrow()
        })

        test("validates attachment id format", async () => {
            await expect(async () => {
                await deleteAttachment({ id: "invalid-uuid" }, util.getMockContext())
            }).rejects.toThrow()
        })
    })

    describe("queries", () => {
        test("getTransaction includes attachments", async () => {
            const transactionId = util.getTestData().transactions.standard.income.id
            const attachmentData = {
                id: "f47ac10b-58cc-4372-a567-0e02b2c3d475",
                transactionId: transactionId,
                name: "query-test.pdf",
                size: 512,
                type: "application/pdf",
                path: "data/transactions/test/attachments/query-test.pdf"
            }

            await createTestAttachment(attachmentData)

            const transaction = await getTransaction({ id: transactionId }, util.getMockContext())
            expect(transaction.attachments).toBeDefined()
            expect(transaction.attachments).toHaveLength(1)
            expect(transaction.attachments[0].name).toBe("query-test.pdf")
        })

        test("getTransactions includes attachments", async () => {
            const transactionId = util.getTestData().transactions.standard.income.id
            const householdId = util.getTestData().households.standard.id

            await createTestAttachment({
                id: "f47ac10b-58cc-4372-a567-0e02b2c3d476",
                transactionId: transactionId,
                name: "multi-test.pdf",
                size: 256,
                type: "application/pdf",
                path: "data/transactions/test/attachments/multi-test.pdf"
            })

            const { transactions } = await getTransactions({ householdId }, util.getMockContext())
            const transactionWithAttachment = transactions.find((t) => t.id === transactionId)

            expect(transactionWithAttachment).toBeDefined()
            expect(transactionWithAttachment?.attachments).toBeDefined()
            expect(transactionWithAttachment?.attachments.length).toBeGreaterThan(0)
            expect(transactionWithAttachment?.attachments[0].name).toBe("multi-test.pdf")
        })

        test("getTransaction returns empty attachments array when none exist", async () => {
            const transactionId = util.getTestData().transactions.standard.income.id

            const transaction = await getTransaction({ id: transactionId }, util.getMockContext())
            expect(transaction.attachments).toBeDefined()
            expect(transaction.attachments).toHaveLength(0)
        })
    })
})
