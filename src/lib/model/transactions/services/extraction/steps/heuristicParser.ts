import { TransactionType } from "@prisma/client"
import { ExtractionContext, ExtractionStep } from "../types"

// Currency amount patterns (€, $, £, EUR, USD, etc.) — picks the largest match
const AMOUNT_PATTERNS = [
    /(?:Total|Betrag|Amount|Summe|Gesamt|Subtotal|Due|Fällig)[:\s]*([€$£]?\s*[\d.,]+(?:\s*(?:EUR|USD|GBP))?)/gi,
    /([€$£])\s*([\d]{1,3}(?:[.,]\d{3})*(?:[.,]\d{2}))/g,
    /([\d]{1,3}(?:[.,]\d{3})*(?:[.,]\d{2}))\s*([€$£]|EUR|USD|GBP)/g,
]

// Date formats: DD.MM.YYYY, YYYY-MM-DD, DD/MM/YYYY, "January 5, 2024", "5 Jan 2024"
const DATE_PATTERNS = [
    /\b(\d{2})\.(\d{2})\.(\d{4})\b/,
    /\b(\d{4})-(\d{2})-(\d{2})\b/,
    /\b(\d{2})\/(\d{2})\/(\d{4})\b/,
    /\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/i,
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})\b/i,
    /\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+(\d{4})\b/i,
]

const MONTH_MAP: Record<string, number> = {
    january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
    july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
    jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8,
    sep: 9, oct: 10, nov: 11, dec: 12
}

// Type detection keywords
const EXPENSE_KEYWORDS = /\b(invoice|rechnung|payment due|fällig|bill|receipt|quittung|kaufbeleg|debit)\b/i
const INCOME_KEYWORDS = /\b(credit note|gutschrift|refund|rückerstattung|income|einnahme|salary|gehalt)\b/i

// Counterparty / company name patterns
const FROM_PATTERNS = [
    /(?:From|Von|Sender|Absender)[:\s]+([A-Za-z0-9äöüÄÖÜß& .,-]+?)(?:\n|$)/i,
    /(?:Vendor|Supplier|Lieferant)[:\s]+([A-Za-z0-9äöüÄÖÜß& .,-]+?)(?:\n|$)/i,
]

function parseAmount(text: string): number | null {
    const candidates: number[] = []

    for (const pattern of AMOUNT_PATTERNS) {
        pattern.lastIndex = 0
        let match: RegExpExecArray | null
        while ((match = pattern.exec(text)) !== null) {
            // Find the numeric group
            const numStr = match[1] ?? match[2]
            if (!numStr) continue
            const cleaned = numStr.replace(/[€$£EUR USD GBP\s]/g, "").replace(",", ".")
            // Handle European format: 1.234,56 → 1234.56
            const europeanFormat = /^\d{1,3}(?:\.\d{3})+,\d{2}$/.test(numStr.trim())
            const val = europeanFormat
                ? parseFloat(numStr.replace(/\./g, "").replace(",", "."))
                : parseFloat(cleaned)
            if (!isNaN(val) && val > 0) candidates.push(val)
        }
    }

    if (candidates.length === 0) return null
    // Return the largest value (likely the total)
    return Math.max(...candidates)
}

function parseDate(text: string): Date | null {
    for (const pattern of DATE_PATTERNS) {
        const match = text.match(pattern)
        if (!match) continue

        try {
            // DD.MM.YYYY
            if (pattern === DATE_PATTERNS[0]) {
                return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]))
            }
            // YYYY-MM-DD
            if (pattern === DATE_PATTERNS[1]) {
                return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]))
            }
            // DD/MM/YYYY
            if (pattern === DATE_PATTERNS[2]) {
                return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]))
            }
            // DD Month YYYY
            if (pattern === DATE_PATTERNS[3]) {
                const month = MONTH_MAP[match[2].toLowerCase()]
                if (month) return new Date(parseInt(match[3]), month - 1, parseInt(match[1]))
            }
            // Month DD, YYYY
            if (pattern === DATE_PATTERNS[4]) {
                const month = MONTH_MAP[match[1].toLowerCase()]
                if (month) return new Date(parseInt(match[3]), month - 1, parseInt(match[2]))
            }
            // DD Mon YYYY
            if (pattern === DATE_PATTERNS[5]) {
                const month = MONTH_MAP[match[2].toLowerCase()]
                if (month) return new Date(parseInt(match[3]), month - 1, parseInt(match[1]))
            }
        } catch {
            continue
        }
    }
    return null
}

function parseType(text: string): TransactionType | null {
    if (INCOME_KEYWORDS.test(text)) return TransactionType.INCOME
    if (EXPENSE_KEYWORDS.test(text)) return TransactionType.EXPENSE
    return null
}

function parseCounterparty(text: string): string | null {
    for (const pattern of FROM_PATTERNS) {
        const match = text.match(pattern)
        if (match?.[1]) return match[1].trim()
    }

    // Fallback: first non-empty line that looks like a company name
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean)
    for (const line of lines.slice(0, 5)) {
        if (line.length > 3 && line.length < 60 && /[A-Za-z]/.test(line)) {
            return line
        }
    }
    return null
}

export const heuristicParser: ExtractionStep = {
    name: "heuristicParser",
    async execute(context: ExtractionContext): Promise<ExtractionContext> {
        const { rawText, result } = context

        if (!rawText) return context

        const updated = { ...result }

        if (updated.amount === null) {
            const amount = parseAmount(rawText)
            if (amount !== null) {
                updated.amount = amount
                updated.confidence = { ...updated.confidence, amount: 0.6 }
            }
        }

        if (updated.valueDate === null) {
            const date = parseDate(rawText)
            if (date !== null) {
                updated.valueDate = date
                updated.confidence = { ...updated.confidence, valueDate: 0.6 }
            }
        }

        if (updated.type === null) {
            const type = parseType(rawText)
            if (type !== null) {
                updated.type = type
                updated.confidence = { ...updated.confidence, type: 0.5 }
            }
        }

        if (updated.counterpartyName === null) {
            const counterparty = parseCounterparty(rawText)
            if (counterparty !== null) {
                updated.counterpartyName = counterparty
                updated.confidence = { ...updated.confidence, counterpartyName: 0.4 }
            }
        }

        if (updated.name === null && updated.counterpartyName !== null) {
            updated.name = updated.counterpartyName
            updated.confidence = { ...updated.confidence, name: 0.3 }
        }

        return { ...context, result: updated }
    }
}
