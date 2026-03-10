import { ExtractionContext, ExtractionResult, ExtractionStep } from "./types"
import { textExtractor } from "./steps/textExtractor"
import { aiStructurer } from "./steps/aiStructurer"
import { heuristicParser } from "./steps/heuristicParser"

const STEPS: ExtractionStep[] = [textExtractor, aiStructurer, heuristicParser]

function initialContext(fileBuffer: Buffer, fileName: string, mimeType: string): ExtractionContext {
    const result: ExtractionResult = {
        name: null,
        amount: null,
        type: null,
        valueDate: null,
        description: null,
        counterpartyName: null,
        confidence: {},
        rawText: ""
    }
    return { fileBuffer, fileName, mimeType, rawText: "", result }
}

export async function extractInvoiceData(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<ExtractionResult> {
    let context = initialContext(fileBuffer, fileName, mimeType)

    for (const step of STEPS) {
        try {
            context = await step.execute(context)
        } catch (err) {
            console.warn(`[invoiceExtractor] Step "${step.name}" failed:`, err)
            // Continue pipeline with whatever context we have
        }
    }

    return context.result
}
