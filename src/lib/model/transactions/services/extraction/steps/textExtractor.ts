import { ExtractionContext, ExtractionStep } from "../types"
import path from "path"

const MIN_PDF_TEXT_LENGTH = 50

async function extractPdfText(buffer: Buffer): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse")
    const data = await pdfParse(buffer)
    return data.text ?? ""
}

async function extractImageText(buffer: Buffer): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Tesseract = require("tesseract.js")
    const cacheDir = path.join(process.cwd(), "data", "tesseract")
    const worker = await Tesseract.createWorker("eng+deu", 1, {
        cachePath: cacheDir,
        logger: () => { /* suppress logs */ }
    })
    const { data: { text } } = await worker.recognize(buffer)
    await worker.terminate()
    return text ?? ""
}

export const textExtractor: ExtractionStep = {
    name: "textExtractor",
    async execute(context: ExtractionContext): Promise<ExtractionContext> {
        const { fileBuffer, mimeType } = context
        let rawText = ""

        if (mimeType === "application/pdf") {
            rawText = await extractPdfText(fileBuffer)
            // Treat as scanned PDF if too little text — fall through to OCR
            if (rawText.trim().length < MIN_PDF_TEXT_LENGTH) {
                try {
                    rawText = await extractImageText(fileBuffer)
                } catch (err) {
                    console.warn("[textExtractor] OCR fallback failed for scanned PDF:", err)
                }
            }
        } else if (mimeType.startsWith("image/")) {
            rawText = await extractImageText(fileBuffer)
        }

        return {
            ...context,
            rawText,
            result: { ...context.result, rawText }
        }
    }
}
