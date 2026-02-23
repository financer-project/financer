import db from "src/lib/db"
import { CounterpartyType, RecurrenceFrequency, TransactionType } from "@prisma/client"

export type SuggestedTemplateTransaction = {
    id: string
    name: string | null
    amount: number
    type: TransactionType
    valueDate: Date
    category: { id: string; name: string; color: string | null } | null
    counterparty: { id: string; name: string; type: CounterpartyType } | null
}

export type SuggestedTemplate = {
    name: string
    amount: number
    type: TransactionType
    frequency: RecurrenceFrequency
    confidence: "HIGH" | "MEDIUM" | "LOW"
    occurrences: number
    latestDate: Date
    accountId: string
    categoryId: string | null
    counterpartyId: string | null
    transactions: SuggestedTemplateTransaction[]
}

function median(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function stdDev(values: number[]): number {
    if (values.length < 2) return 0
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length
    return Math.sqrt(variance)
}

function classifyFrequency(medianInterval: number): RecurrenceFrequency | null {
    if (medianInterval >= 0.5 && medianInterval <= 2) return RecurrenceFrequency.DAILY
    if (medianInterval >= 4 && medianInterval <= 10) return RecurrenceFrequency.WEEKLY
    if (medianInterval >= 20 && medianInterval <= 45) return RecurrenceFrequency.MONTHLY
    if (medianInterval >= 300 && medianInterval <= 400) return RecurrenceFrequency.YEARLY
    return null
}

function assignConfidence(occurrences: number, intervalStdDev: number): "HIGH" | "MEDIUM" | "LOW" {
    if (occurrences >= 3 && intervalStdDev < 4) return "HIGH"
    if (occurrences >= 3 || (occurrences === 2 && intervalStdDev < 4)) return "MEDIUM"
    return "LOW"
}

const confidenceOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 }

export async function detectRecurringTransactions(householdId: string): Promise<SuggestedTemplate[]> {
    const [transactions, existingTemplates] = await Promise.all([
        db.transaction.findMany({
        where: {
            account: { householdId },
            transactionTemplateId: null
        },
        orderBy: { valueDate: "asc" },
            include: {
                account: true,
                category: { select: { id: true, name: true, color: true } },
                counterparty: { select: { id: true, name: true, type: true } }
            }
        }),
        db.transactionTemplate.findMany({
            where: { account: { householdId } },
            select: { name: true, type: true }
        })
    ])

    const existingTemplateKeys = new Set(
        existingTemplates.map(t => `${t.name ?? ""}|${t.type}`)
    )

    type GroupEntry = {
        id: string
        valueDate: Date
        accountId: string
        categoryId: string | null
        counterpartyId: string | null
        amount: number
        name: string | null
        type: TransactionType
        category: { id: string; name: string; color: string | null } | null
        counterparty: { id: string; name: string; type: CounterpartyType } | null
    }

    const groups = new Map<string, GroupEntry[]>()

    for (const tx of transactions) {
        const key = `${tx.name ?? ""}|${Math.round(Math.abs(tx.amount))}|${tx.type}`
        if (!groups.has(key)) groups.set(key, [])
        groups.get(key)!.push({
            id: tx.id,
            valueDate: tx.valueDate,
            accountId: tx.accountId,
            categoryId: tx.categoryId,
            counterpartyId: tx.counterpartyId,
            amount: tx.amount,
            name: tx.name,
            type: tx.type,
            category: tx.category ?? null,
            counterparty: tx.counterparty ?? null
        })
    }

    const suggestions: SuggestedTemplate[] = []

    for (const [key, entries] of groups) {
        if (entries.length < 2) continue

        const [name, , typeStr] = key.split("|")
        const type = typeStr as TransactionType

        if (existingTemplateKeys.has(`${name}|${type}`)) continue

        const intervals: number[] = []
        for (let i = 1; i < entries.length; i++) {
            const days =
                (entries[i].valueDate.getTime() - entries[i - 1].valueDate.getTime()) /
                (1000 * 60 * 60 * 24)
            intervals.push(days)
        }

        const med = median(intervals)
        const frequency = classifyFrequency(med)
        if (!frequency) continue

        const sd = stdDev(intervals)
        const confidence = assignConfidence(entries.length, sd)
        const latest = entries[entries.length - 1]

        suggestions.push({
            name: name || "(unnamed)",
            amount: Math.abs(latest.amount),
            type,
            frequency,
            confidence,
            occurrences: entries.length,
            latestDate: latest.valueDate,
            accountId: latest.accountId,
            categoryId: latest.categoryId,
            counterpartyId: latest.counterpartyId,
            transactions: entries.map(e => ({
                id: e.id,
                name: e.name,
                amount: e.amount,
                type: e.type,
                valueDate: e.valueDate,
                category: e.category,
                counterparty: e.counterparty
            }))
        })
    }

    suggestions.sort((a, b) => {
        const cDiff = confidenceOrder[a.confidence] - confidenceOrder[b.confidence]
        if (cDiff !== 0) return cDiff
        return b.occurrences - a.occurrences
    })

    return suggestions
}
