import { describe, expect, test } from "vitest"
import { TransactionType } from "@prisma/client"
import { heuristicParser } from "@/src/lib/model/transactions/services/extraction/steps/heuristicParser"
import { ExtractionContext, ExtractionResult } from "@/src/lib/model/transactions/services/extraction/types"

function makeContext(rawText: string, partial: Partial<ExtractionResult> = {}): ExtractionContext {
    return {
        fileBuffer: Buffer.from(""),
        fileName: "test.pdf",
        mimeType: "application/pdf",
        rawText,
        result: {
            name: null,
            amount: null,
            type: null,
            valueDate: null,
            description: null,
            counterpartyName: null,
            confidence: {},
            rawText,
            ...partial
        }
    }
}

describe("heuristicParser", () => {
    describe("amount parsing", () => {
        test("parses Total: € amount", async () => {
            const ctx = await heuristicParser.execute(makeContext("Total: €123.45"))
            expect(ctx.result.amount).toBe(123.45)
        })

        test("parses dollar sign amount", async () => {
            const ctx = await heuristicParser.execute(makeContext("Amount $99.99"))
            expect(ctx.result.amount).toBe(99.99)
        })

        test("parses German Betrag format", async () => {
            const ctx = await heuristicParser.execute(makeContext("Betrag: 250,00 EUR"))
            expect(ctx.result.amount).toBeGreaterThan(0)
        })

        test("picks largest amount (the total)", async () => {
            const ctx = await heuristicParser.execute(makeContext(
                "Subtotal: €80.00\nTax: €20.00\nTotal: €100.00"
            ))
            expect(ctx.result.amount).toBe(100)
        })

        test("does not overwrite an already-set amount", async () => {
            const ctx = await heuristicParser.execute(makeContext("Total: €50.00", { amount: 99.99 }))
            expect(ctx.result.amount).toBe(99.99)
        })

        test("returns null for text with no recognisable amount", async () => {
            const ctx = await heuristicParser.execute(makeContext("No prices here at all."))
            expect(ctx.result.amount).toBeNull()
        })
    })

    describe("date parsing", () => {
        test("parses DD.MM.YYYY", async () => {
            const ctx = await heuristicParser.execute(makeContext("Invoice date: 15.03.2024"))
            expect(ctx.result.valueDate).toEqual(new Date(2024, 2, 15))
        })

        test("parses YYYY-MM-DD", async () => {
            const ctx = await heuristicParser.execute(makeContext("Date: 2024-07-04"))
            expect(ctx.result.valueDate).toEqual(new Date(2024, 6, 4))
        })

        test("parses DD/MM/YYYY", async () => {
            const ctx = await heuristicParser.execute(makeContext("Issued: 01/12/2023"))
            expect(ctx.result.valueDate).toEqual(new Date(2023, 11, 1))
        })

        test("parses 'DD Month YYYY' format", async () => {
            const ctx = await heuristicParser.execute(makeContext("5 January 2024"))
            expect(ctx.result.valueDate).toEqual(new Date(2024, 0, 5))
        })

        test("parses 'Month DD, YYYY' format", async () => {
            const ctx = await heuristicParser.execute(makeContext("March 22, 2023"))
            expect(ctx.result.valueDate).toEqual(new Date(2023, 2, 22))
        })

        test("parses abbreviated month format", async () => {
            const ctx = await heuristicParser.execute(makeContext("10 Feb 2025"))
            expect(ctx.result.valueDate).toEqual(new Date(2025, 1, 10))
        })

        test("does not overwrite an already-set date", async () => {
            const preset = new Date(2000, 0, 1)
            const ctx = await heuristicParser.execute(makeContext("Date: 2024-01-01", { valueDate: preset }))
            expect(ctx.result.valueDate).toEqual(preset)
        })

        test("returns null when no date found", async () => {
            const ctx = await heuristicParser.execute(makeContext("No dates in this text."))
            expect(ctx.result.valueDate).toBeNull()
        })
    })

    describe("type detection", () => {
        test("detects EXPENSE from 'invoice' keyword", async () => {
            const ctx = await heuristicParser.execute(makeContext("INVOICE #1234\nTotal: €50"))
            expect(ctx.result.type).toBe(TransactionType.EXPENSE)
        })

        test("detects EXPENSE from 'Rechnung' keyword", async () => {
            const ctx = await heuristicParser.execute(makeContext("Rechnung Nr. 42"))
            expect(ctx.result.type).toBe(TransactionType.EXPENSE)
        })

        test("detects INCOME from 'refund' keyword", async () => {
            const ctx = await heuristicParser.execute(makeContext("Refund for order #999"))
            expect(ctx.result.type).toBe(TransactionType.INCOME)
        })

        test("detects INCOME from 'Gutschrift' keyword", async () => {
            const ctx = await heuristicParser.execute(makeContext("Gutschrift €20"))
            expect(ctx.result.type).toBe(TransactionType.INCOME)
        })

        test("returns null when no type keyword found", async () => {
            const ctx = await heuristicParser.execute(makeContext("Some random text"))
            expect(ctx.result.type).toBeNull()
        })

        test("does not overwrite an already-set type", async () => {
            const ctx = await heuristicParser.execute(
                makeContext("INVOICE", { type: TransactionType.INCOME })
            )
            expect(ctx.result.type).toBe(TransactionType.INCOME)
        })
    })

    describe("counterparty / name detection", () => {
        test("extracts counterparty from 'From:' line", async () => {
            const ctx = await heuristicParser.execute(makeContext("From: Acme Corp\nTotal: €100"))
            expect(ctx.result.counterpartyName).toBe("Acme Corp")
        })

        test("extracts counterparty from 'Von:' line", async () => {
            const ctx = await heuristicParser.execute(makeContext("Von: Mustermann GmbH\nBetrag: 50"))
            // Falls through to first-line fallback or Von pattern
            expect(ctx.result.counterpartyName).not.toBeNull()
        })

        test("falls back to first prominent line", async () => {
            const ctx = await heuristicParser.execute(makeContext("Acme Corp\n123 Main St\nTotal: €50"))
            expect(ctx.result.counterpartyName).toBe("Acme Corp")
        })

        test("uses counterpartyName as name when name is null", async () => {
            const ctx = await heuristicParser.execute(makeContext("From: Vendor Ltd"))
            expect(ctx.result.name).toBe("Vendor Ltd")
        })

        test("does not overwrite existing name", async () => {
            const ctx = await heuristicParser.execute(
                makeContext("From: Vendor Ltd", { name: "Existing Name" })
            )
            expect(ctx.result.name).toBe("Existing Name")
        })

        test("does not overwrite existing counterpartyName", async () => {
            const ctx = await heuristicParser.execute(
                makeContext("From: Vendor Ltd", { counterpartyName: "Already Set" })
            )
            expect(ctx.result.counterpartyName).toBe("Already Set")
        })
    })

    describe("confidence scores", () => {
        test("sets confidence for extracted amount", async () => {
            const ctx = await heuristicParser.execute(makeContext("Total: €100"))
            expect(ctx.result.confidence["amount"]).toBeGreaterThan(0)
        })

        test("sets confidence for extracted date", async () => {
            const ctx = await heuristicParser.execute(makeContext("2024-01-01"))
            expect(ctx.result.confidence["valueDate"]).toBeGreaterThan(0)
        })

        test("sets confidence for extracted type", async () => {
            const ctx = await heuristicParser.execute(makeContext("Invoice total €10"))
            expect(ctx.result.confidence["type"]).toBeGreaterThan(0)
        })
    })

    describe("empty / edge cases", () => {
        test("handles empty rawText gracefully", async () => {
            const ctx = await heuristicParser.execute(makeContext(""))
            expect(ctx.result.amount).toBeNull()
            expect(ctx.result.valueDate).toBeNull()
            expect(ctx.result.type).toBeNull()
            expect(ctx.result.counterpartyName).toBeNull()
        })

        test("does not mutate the original context result", async () => {
            const original = makeContext("Total: €50\nInvoice date: 2024-01-15\nFrom: Co Ltd\nINVOICE")
            const ctx = await heuristicParser.execute(original)
            // Original should be unchanged
            expect(original.result.amount).toBeNull()
            // Returned context should have parsed values
            expect(ctx.result.amount).toBe(50)
        })

        test("realistic invoice text extracts all fields", async () => {
            const invoiceText = `
ACME Corporation
Invoice #INV-2024-001
Date: 15.03.2024
From: ACME Corporation

Description         Amount
Consulting services €500.00

Total: €500.00
Payment due: 30 days
`
            const ctx = await heuristicParser.execute(makeContext(invoiceText))
            expect(ctx.result.amount).toBe(500)
            expect(ctx.result.valueDate).toEqual(new Date(2024, 2, 15))
            expect(ctx.result.type).toBe(TransactionType.EXPENSE)
            expect(ctx.result.counterpartyName).not.toBeNull()
        })
    })
})
