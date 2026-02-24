import db from "src/lib/db"
import { RecurrenceFrequency, TransactionType } from "@prisma/client"
import { addDays, addMonths, addWeeks, addYears } from "date-fns"

function calculateNextDueDate(current: Date, frequency: RecurrenceFrequency): Date {
    switch (frequency) {
        case RecurrenceFrequency.DAILY:
            return addDays(current, 1)
        case RecurrenceFrequency.WEEKLY:
            return addWeeks(current, 1)
        case RecurrenceFrequency.MONTHLY:
            return addMonths(current, 1)
        case RecurrenceFrequency.YEARLY:
            return addYears(current, 1)
    }
}

export async function processTransactionTemplates(): Promise<void> {
    const now = new Date()

    const templates = await db.transactionTemplate.findMany({
        where: {
            isActive: true,
            nextDueDate: { lte: now }
        }
    })

    console.log(`Processing ${templates.length} transaction template(s)`)

    for (const template of templates) {
        // Create transaction from template
        const amount = template.type === TransactionType.EXPENSE
            ? -Math.abs(template.amount)
            : Math.abs(template.amount)

        await db.transaction.create({
            data: {
                name: template.name,
                description: template.description,
                type: template.type,
                amount,
                valueDate: template.nextDueDate,
                accountId: template.accountId,
                categoryId: template.categoryId,
                counterpartyId: template.counterpartyId,
                transactionTemplateId: template.id
            }
        })

        // Calculate next due date
        const nextDueDate = calculateNextDueDate(template.nextDueDate, template.frequency)

        // Deactivate if past end date
        const isActive = template.endDate ? nextDueDate <= template.endDate : true

        await db.transactionTemplate.update({
            where: { id: template.id },
            data: { nextDueDate, isActive }
        })
    }
}
