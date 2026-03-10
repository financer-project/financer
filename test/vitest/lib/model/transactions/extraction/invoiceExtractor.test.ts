import { describe, expect, test, vi } from "vitest"
import { TransactionType } from "@prisma/client"
import { extractInvoiceData } from "@/src/lib/model/transactions/services/extraction/invoiceExtractor"
import type { ExtractionContext } from "@/src/lib/model/transactions/services/extraction/types"

// Mock the individual steps so we can control their behaviour
vi.mock("@/src/lib/model/transactions/services/extraction/steps/textExtractor", () => ({
    textExtractor: {
        name: "textExtractor",
        execute: vi.fn(async (ctx: ExtractionContext) => ({
            ...ctx,
            rawText: "INVOICE\nFrom: Test Corp\nTotal: €123.45\nDate: 2024-03-15",
            result: {
                ...ctx.result,
                rawText: "INVOICE\nFrom: Test Corp\nTotal: €123.45\nDate: 2024-03-15"
            }
        }))
    }
}))

vi.mock("@/src/lib/model/transactions/services/extraction/steps/aiStructurer", () => ({
    aiStructurer: {
        name: "aiStructurer",
        execute: vi.fn(async (ctx: ExtractionContext) => ctx) // pass-through
    }
}))

vi.mock("@/src/lib/model/transactions/services/extraction/steps/heuristicParser", () => ({
    heuristicParser: {
        name: "heuristicParser",
        execute: vi.fn(async (ctx: ExtractionContext) => ({
            ...ctx,
            result: {
                ...ctx.result,
                name: "Test Corp",
                amount: 123.45,
                type: TransactionType.EXPENSE,
                valueDate: new Date(2024, 2, 15),
                counterpartyName: "Test Corp",
                confidence: { amount: 0.6, valueDate: 0.6, type: 0.5, counterpartyName: 0.4 }
            }
        }))
    }
}))

describe("invoiceExtractor", () => {
    test("runs all three steps in sequence and returns final result", async () => {
        const buffer = Buffer.from("fake pdf content")
        const result = await extractInvoiceData(buffer, "invoice.pdf", "application/pdf")

        expect(result.amount).toBe(123.45)
        expect(result.type).toBe(TransactionType.EXPENSE)
        expect(result.valueDate).toEqual(new Date(2024, 2, 15))
        expect(result.name).toBe("Test Corp")
        expect(result.counterpartyName).toBe("Test Corp")
    })

    test("continues pipeline if one step throws", async () => {
        const { textExtractor } = await import("@/src/lib/model/transactions/services/extraction/steps/textExtractor")
        vi.mocked(textExtractor.execute).mockRejectedValueOnce(new Error("OCR failed"))

        const buffer = Buffer.from("fake content")
        // Should not throw, heuristicParser still runs
        await expect(extractInvoiceData(buffer, "scan.jpg", "image/jpeg")).resolves.not.toThrow()
    })

    test("returns empty result when all steps fail", async () => {
        const { textExtractor } = await import("@/src/lib/model/transactions/services/extraction/steps/textExtractor")
        const { aiStructurer } = await import("@/src/lib/model/transactions/services/extraction/steps/aiStructurer")
        const { heuristicParser } = await import("@/src/lib/model/transactions/services/extraction/steps/heuristicParser")

        vi.mocked(textExtractor.execute).mockRejectedValueOnce(new Error("fail"))
        vi.mocked(aiStructurer.execute).mockRejectedValueOnce(new Error("fail"))
        vi.mocked(heuristicParser.execute).mockRejectedValueOnce(new Error("fail"))

        const result = await extractInvoiceData(Buffer.from(""), "empty.pdf", "application/pdf")

        expect(result.amount).toBeNull()
        expect(result.valueDate).toBeNull()
        expect(result.type).toBeNull()
        expect(result.name).toBeNull()
    })

    test("initialises context with correct file metadata", async () => {
        const { textExtractor } = await import("@/src/lib/model/transactions/services/extraction/steps/textExtractor")

        let capturedContext: ExtractionContext | undefined
        vi.mocked(textExtractor.execute).mockImplementationOnce(async (ctx) => {
            capturedContext = ctx
            return ctx
        })

        const buffer = Buffer.from("pdf bytes")
        await extractInvoiceData(buffer, "receipt.pdf", "application/pdf")

        expect(capturedContext?.fileName).toBe("receipt.pdf")
        expect(capturedContext?.mimeType).toBe("application/pdf")
        expect(capturedContext?.fileBuffer).toEqual(buffer)
        expect(capturedContext?.rawText).toBe("")
        expect(capturedContext?.result.amount).toBeNull()
    })
})
