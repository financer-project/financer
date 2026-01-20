import { describe, expect, test, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { POST } from "@/src/app/api/transactions/attachments/upload/route"
import { GET } from "@/src/app/api/transactions/attachments/download/[attachmentId]/route"
import db from "@/src/lib/db"
import { saveAttachmentFile, readFile } from "@/src/lib/util/fileStorage"

// Mock db
vi.mock("@/src/lib/db", () => ({
    default: {
        transaction: {
            findUnique: vi.fn()
        },
        attachment: {
            create: vi.fn(),
            update: vi.fn(),
            findUnique: vi.fn()
        }
    }
}))

// Mock fileStorage
vi.mock("@/src/lib/util/fileStorage", () => ({
    saveAttachmentFile: vi.fn(),
    readFile: vi.fn(),
    deleteFile: vi.fn(),
    ensureDirectoryExists: vi.fn()
}))

describe("Attachment API Routes", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("POST /api/transactions/attachments/upload", () => {
        const createMockRequest = (transactionId: string | null, file?: File) => {
            const url = transactionId
                ? `http://localhost/api/transactions/attachments/upload?transactionId=${transactionId}`
                : "http://localhost/api/transactions/attachments/upload"

            const formData = new FormData()
            if (file) {
                formData.append("file", file)
            }

            return new NextRequest(url, {
                method: "POST",
                body: formData
            })
        }

        const createMockFile = (name: string, content: string, type: string) => {
            const blob = new Blob([content], { type })
            return new File([blob], name, { type })
        }

        test("returns 400 if transactionId is missing", async () => {
            const request = createMockRequest(null)

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(400)
            expect(data.error).toBe("Transaction ID is required")
        })

        test("returns 404 if transaction does not exist", async () => {
            vi.mocked(db.transaction.findUnique).mockResolvedValue(null)

            const file = createMockFile("test.pdf", "test content", "application/pdf")
            const request = createMockRequest("non-existent-id", file)

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(404)
            expect(data.error).toBe("Transaction not found")
        })

        test("returns 400 if file is missing", async () => {
            vi.mocked(db.transaction.findUnique).mockResolvedValue({
                id: "transaction-123",
                accountId: "account-123",
                amount: 100,
                date: new Date(),
                description: "Test transaction",
                type: "INCOME",
                counterpartyId: null,
                categoryId: null,
                createdAt: new Date(),
                updatedAt: new Date()
            })

            const request = createMockRequest("transaction-123")

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(400)
            expect(data.error).toBe("File is required")
        })

        test("uploads attachment successfully", async () => {
            const transactionId = "transaction-123"
            const attachmentId = "attachment-456"

            vi.mocked(db.transaction.findUnique).mockResolvedValue({
                id: transactionId,
                accountId: "account-123",
                amount: 100,
                date: new Date(),
                description: "Test transaction",
                type: "INCOME",
                counterpartyId: null,
                categoryId: null,
                createdAt: new Date(),
                updatedAt: new Date()
            })

            vi.mocked(db.attachment.create).mockResolvedValue({
                id: attachmentId,
                name: "test.pdf",
                size: 12,
                type: "application/pdf",
                path: "",
                transactionId,
                createdAt: new Date(),
                updatedAt: new Date()
            })

            vi.mocked(saveAttachmentFile).mockResolvedValue(
                `data/transactions/${transactionId}/attachments/${attachmentId}/test.pdf`
            )

            vi.mocked(db.attachment.update).mockResolvedValue({
                id: attachmentId,
                name: "test.pdf",
                size: 12,
                type: "application/pdf",
                path: `data/transactions/${transactionId}/attachments/${attachmentId}/test.pdf`,
                transactionId,
                createdAt: new Date(),
                updatedAt: new Date()
            })

            const file = createMockFile("test.pdf", "test content", "application/pdf")
            const request = createMockRequest(transactionId, file)

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.id).toBe(attachmentId)
            expect(data.name).toBe("test.pdf")
            expect(data.type).toBe("application/pdf")

            expect(db.attachment.create).toHaveBeenCalledWith({
                data: {
                    name: "test.pdf",
                    size: 12,
                    type: "application/pdf",
                    path: "",
                    transaction: {
                        connect: { id: transactionId }
                    }
                }
            })

            expect(saveAttachmentFile).toHaveBeenCalledWith(
                transactionId,
                attachmentId,
                "test.pdf",
                expect.any(Buffer)
            )

            expect(db.attachment.update).toHaveBeenCalledWith({
                where: { id: attachmentId },
                data: { path: `data/transactions/${transactionId}/attachments/${attachmentId}/test.pdf` }
            })
        })

        test("returns 500 on unexpected error", async () => {
            vi.mocked(db.transaction.findUnique).mockRejectedValue(new Error("Database error"))

            const file = createMockFile("test.pdf", "test content", "application/pdf")
            const request = createMockRequest("transaction-123", file)

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(500)
            expect(data.error).toBe("Failed to upload attachment")
        })
    })

    describe("GET /api/transactions/attachments/download/[attachmentId]", () => {
        const createMockRequest = (attachmentId: string, download?: boolean) => {
            const url = download
                ? `http://localhost/api/transactions/attachments/download/${attachmentId}?download=true`
                : `http://localhost/api/transactions/attachments/download/${attachmentId}`

            return new NextRequest(url, { method: "GET" })
        }

        const createRouteParams = (attachmentId: string) => ({
            params: Promise.resolve({ attachmentId })
        })

        test("returns 404 if attachment does not exist", async () => {
            vi.mocked(db.attachment.findUnique).mockResolvedValue(null)

            const request = createMockRequest("non-existent-id")
            const response = await GET(request, createRouteParams("non-existent-id"))
            const data = await response.json()

            expect(response.status).toBe(404)
            expect(data.error).toBe("Attachment not found")
        })

        test("downloads attachment with inline disposition by default", async () => {
            const attachmentId = "attachment-123"
            const fileContent = Buffer.from("test file content")

            vi.mocked(db.attachment.findUnique).mockResolvedValue({
                id: attachmentId,
                name: "document.pdf",
                size: fileContent.length,
                type: "application/pdf",
                path: "/path/to/document.pdf",
                transactionId: "transaction-123",
                createdAt: new Date(),
                updatedAt: new Date()
            })

            vi.mocked(readFile).mockReturnValue(fileContent)

            const request = createMockRequest(attachmentId)
            const response = await GET(request, createRouteParams(attachmentId))

            expect(response.status).toBe(200)
            expect(response.headers.get("Content-Type")).toBe("application/pdf")
            expect(response.headers.get("Content-Disposition")).toBe('inline; filename="document.pdf"')

            const responseBody = await response.arrayBuffer()
            expect(Buffer.from(responseBody)).toEqual(fileContent)
        })

        test("downloads attachment with attachment disposition when download=true", async () => {
            const attachmentId = "attachment-123"
            const fileContent = Buffer.from("test file content")

            vi.mocked(db.attachment.findUnique).mockResolvedValue({
                id: attachmentId,
                name: "document.pdf",
                size: fileContent.length,
                type: "application/pdf",
                path: "/path/to/document.pdf",
                transactionId: "transaction-123",
                createdAt: new Date(),
                updatedAt: new Date()
            })

            vi.mocked(readFile).mockReturnValue(fileContent)

            const request = createMockRequest(attachmentId, true)
            const response = await GET(request, createRouteParams(attachmentId))

            expect(response.status).toBe(200)
            expect(response.headers.get("Content-Type")).toBe("application/pdf")
            expect(response.headers.get("Content-Disposition")).toBe('attachment; filename="document.pdf"')
        })

        test("returns 500 when file read fails", async () => {
            const attachmentId = "attachment-123"

            vi.mocked(db.attachment.findUnique).mockResolvedValue({
                id: attachmentId,
                name: "document.pdf",
                size: 100,
                type: "application/pdf",
                path: "/path/to/document.pdf",
                transactionId: "transaction-123",
                createdAt: new Date(),
                updatedAt: new Date()
            })

            vi.mocked(readFile).mockImplementation(() => {
                throw new Error("File not found")
            })

            const request = createMockRequest(attachmentId)
            const response = await GET(request, createRouteParams(attachmentId))
            const data = await response.json()

            expect(response.status).toBe(500)
            expect(data.error).toBe("Failed to download attachment")
        })

        test("handles different file types correctly", async () => {
            const attachmentId = "attachment-123"
            const fileContent = Buffer.from("PNG image content")

            vi.mocked(db.attachment.findUnique).mockResolvedValue({
                id: attachmentId,
                name: "image.png",
                size: fileContent.length,
                type: "image/png",
                path: "/path/to/image.png",
                transactionId: "transaction-123",
                createdAt: new Date(),
                updatedAt: new Date()
            })

            vi.mocked(readFile).mockReturnValue(fileContent)

            const request = createMockRequest(attachmentId)
            const response = await GET(request, createRouteParams(attachmentId))

            expect(response.status).toBe(200)
            expect(response.headers.get("Content-Type")).toBe("image/png")
            expect(response.headers.get("Content-Disposition")).toBe('inline; filename="image.png"')
        })
    })
})
