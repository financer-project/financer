import { beforeEach, describe, expect, test, vi } from "vitest"
import { NextRequest } from "next/server"
import { POST } from "@/src/app/api/transactions/extract/route"

// Mock fileStorage
vi.mock("@/src/lib/util/fileStorage", () => ({
    saveTempFile: vi.fn(),
    cleanupExpiredTempFiles: vi.fn()
}))

// Mock the extraction pipeline
vi.mock("@/src/lib/model/transactions/services/extraction/invoiceExtractor", () => ({
    extractInvoiceData: vi.fn()
}))

import { saveTempFile, cleanupExpiredTempFiles } from "@/src/lib/util/fileStorage"
import { extractInvoiceData } from "@/src/lib/model/transactions/services/extraction/invoiceExtractor"
import { TransactionType } from "@prisma/client"

const MOCK_EXTRACTION = {
    name: "Acme Corp",
    amount: 250.0,
    type: TransactionType.EXPENSE,
    valueDate: new Date("2024-03-15"),
    description: null,
    counterpartyName: "Acme Corp",
    confidence: { amount: 0.8, type: 0.7 },
    rawText: "INVOICE\nAcme Corp\nTotal: €250"
}

function makeRequest(file?: File): NextRequest {
    const formData = new FormData()
    if (file) formData.append("file", file)
    return new NextRequest("http://localhost/api/transactions/extract", {
        method: "POST",
        body: formData
    })
}

function makeFile(name: string, content: string, type: string): File {
    return new File([new Blob([content], { type })], name, { type })
}

describe("POST /api/transactions/extract", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(extractInvoiceData).mockResolvedValue(MOCK_EXTRACTION)
        vi.mocked(cleanupExpiredTempFiles).mockReturnValue(undefined)
    })

    test("returns 400 when no file is provided", async () => {
        const response = await POST(makeRequest())
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toMatch(/no file/i)
    })

    test("returns 400 for an unsupported file type", async () => {
        const file = makeFile("doc.txt", "plain text", "text/plain")
        const response = await POST(makeRequest(file))
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toMatch(/invalid file type/i)
    })

    test("returns 400 when file exceeds 10 MB", async () => {
        const bigContent = "x".repeat(11 * 1024 * 1024)
        const file = makeFile("big.pdf", bigContent, "application/pdf")
        const response = await POST(makeRequest(file))
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toMatch(/too large/i)
    })

    test("processes a valid PDF and returns tempFileId + extraction", async () => {
        const file = makeFile("invoice.pdf", "%PDF-1.4 sample content", "application/pdf")
        const response = await POST(makeRequest(file))
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(typeof data.tempFileId).toBe("string")
        expect(data.tempFileId).toHaveLength(36) // UUID v4
        expect(data.fileName).toBe("invoice.pdf")
        expect(data.extraction.amount).toBe(250.0)
        expect(data.extraction.name).toBe("Acme Corp")
    })

    test("processes a valid image file", async () => {
        const file = makeFile("receipt.png", "PNG binary data", "image/png")
        const response = await POST(makeRequest(file))
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.extraction).toBeDefined()
    })

    test("calls saveTempFile with correct arguments", async () => {
        const file = makeFile("bill.pdf", "PDF content", "application/pdf")
        await POST(makeRequest(file))

        expect(saveTempFile).toHaveBeenCalledOnce()
        const [tempFileId, fileName, buffer, mimeType] = vi.mocked(saveTempFile).mock.calls[0]
        expect(typeof tempFileId).toBe("string")
        expect(fileName).toBe("bill.pdf")
        expect(buffer).toBeInstanceOf(Buffer)
        expect(mimeType).toBe("application/pdf")
    })

    test("calls cleanupExpiredTempFiles on each request", async () => {
        const file = makeFile("inv.pdf", "content", "application/pdf")
        await POST(makeRequest(file))

        expect(cleanupExpiredTempFiles).toHaveBeenCalledOnce()
    })

    test("returns 500 when extraction pipeline throws", async () => {
        vi.mocked(extractInvoiceData).mockRejectedValueOnce(new Error("Pipeline exploded"))

        const file = makeFile("inv.pdf", "content", "application/pdf")
        const response = await POST(makeRequest(file))
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data.error).toBeDefined()
    })

    test("still returns 200 when cleanup throws (non-fatal)", async () => {
        vi.mocked(cleanupExpiredTempFiles).mockImplementationOnce(() => {
            throw new Error("Cleanup failed")
        })

        const file = makeFile("inv.pdf", "content", "application/pdf")
        const response = await POST(makeRequest(file))

        expect(response.status).toBe(200)
    })

    test("accepts JPEG file", async () => {
        const file = makeFile("photo.jpg", "JPEG data", "image/jpeg")
        const response = await POST(makeRequest(file))
        expect(response.status).toBe(200)
    })

    test("accepts WEBP file", async () => {
        const file = makeFile("scan.webp", "WEBP data", "image/webp")
        const response = await POST(makeRequest(file))
        expect(response.status).toBe(200)
    })
})
