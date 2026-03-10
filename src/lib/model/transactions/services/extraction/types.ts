import { TransactionType } from "@prisma/client"

export interface ExtractionResult {
    name: string | null
    amount: number | null
    type: TransactionType | null
    valueDate: Date | null
    description: string | null
    counterpartyName: string | null
    confidence: Record<string, number>
    rawText: string
}

export interface ExtractionContext {
    fileBuffer: Buffer
    fileName: string
    mimeType: string
    rawText: string
    result: ExtractionResult
}

export interface ExtractionStep {
    name: string
    execute(context: ExtractionContext): Promise<ExtractionContext>
}
