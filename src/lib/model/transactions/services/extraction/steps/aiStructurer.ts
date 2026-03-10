import { TransactionType } from "@prisma/client"
import { ExtractionContext, ExtractionStep } from "../types"

interface NEREntity {
    word: string
    entity_group?: string
    entity?: string
    score: number
    start: number
    end: number
}

function groupEntitiesByType(entities: NEREntity[]): Record<string, NEREntity[]> {
    const grouped: Record<string, NEREntity[]> = {}
    for (const entity of entities) {
        const type = entity.entity_group ?? entity.entity ?? "MISC"
        if (!grouped[type]) grouped[type] = []
        grouped[type].push(entity)
    }
    return grouped
}

function parseMoneyAmount(word: string): number | null {
    const cleaned = word.replace(/[^0-9.,]/g, "").replace(",", ".")
    const val = parseFloat(cleaned)
    return isNaN(val) ? null : val
}

function parseEntityDate(word: string): Date | null {
    // Try common formats from NER output
    const isoMatch = word.match(/(\d{4})-(\d{2})-(\d{2})/)
    if (isoMatch) return new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]))

    const ddmmyyyy = word.match(/(\d{2})\.(\d{2})\.(\d{4})/)
    if (ddmmyyyy) return new Date(parseInt(ddmmyyyy[3]), parseInt(ddmmyyyy[2]) - 1, parseInt(ddmmyyyy[1]))

    return null
}

export const aiStructurer: ExtractionStep = {
    name: "aiStructurer",
    async execute(context: ExtractionContext): Promise<ExtractionContext> {
        const { rawText } = context

        if (!rawText) return context

        let pipeline: (text: string) => Promise<NEREntity[]>

        try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { pipeline: createPipeline } = require("@huggingface/transformers")
            pipeline = await createPipeline("token-classification", "Xenova/bert-base-NER", {
                aggregation_strategy: "simple"
            })
        } catch (err) {
            console.warn("[aiStructurer] Model not available, skipping:", err)
            return context
        }

        let entities: NEREntity[]
        try {
            // Truncate text to avoid model token limits
            const truncated = rawText.slice(0, 2000)
            entities = await pipeline(truncated)
        } catch (err) {
            console.warn("[aiStructurer] Inference failed, skipping:", err)
            return context
        }

        const grouped = groupEntitiesByType(entities)
        const updated = { ...context.result }

        // Extract organization (counterparty)
        if (updated.counterpartyName === null && grouped["ORG"]?.length) {
            const best = grouped["ORG"].reduce((a, b) => a.score > b.score ? a : b)
            updated.counterpartyName = best.word
            updated.confidence = { ...updated.confidence, counterpartyName: best.score }
        }

        // Extract money (amount)
        if (updated.amount === null && grouped["MONEY"]?.length) {
            const amounts = grouped["MONEY"]
                .map(e => ({ val: parseMoneyAmount(e.word), score: e.score }))
                .filter(e => e.val !== null && e.val! > 0)
            if (amounts.length > 0) {
                const best = amounts.reduce((a, b) => (a.val! > b.val! ? a : b))
                updated.amount = best.val!
                updated.confidence = { ...updated.confidence, amount: best.score }
            }
        }

        // Extract date
        if (updated.valueDate === null && grouped["DATE"]?.length) {
            for (const entity of grouped["DATE"]) {
                const date = parseEntityDate(entity.word)
                if (date) {
                    updated.valueDate = date
                    updated.confidence = { ...updated.confidence, valueDate: entity.score }
                    break
                }
            }
        }

        // Infer type from ORG/MISC context (invoices → EXPENSE by default)
        if (updated.type === null && (grouped["ORG"] || grouped["MONEY"])) {
            updated.type = TransactionType.EXPENSE
            updated.confidence = { ...updated.confidence, type: 0.4 }
        }

        if (updated.name === null && updated.counterpartyName !== null) {
            updated.name = updated.counterpartyName
            updated.confidence = { ...updated.confidence, name: updated.confidence["counterpartyName"] ?? 0.4 }
        }

        return { ...context, result: updated }
    }
}
