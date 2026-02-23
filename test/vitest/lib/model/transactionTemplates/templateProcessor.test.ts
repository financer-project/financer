import { beforeEach, describe, expect, test } from "vitest"
import { processTransactionTemplates } from "@/src/lib/model/transactionTemplates/services/templateProcessor"
import TestUtilityMock from "@/test/utility/TestUtilityMock"
import { RecurrenceFrequency, TransactionType } from "@prisma/client"
import { DateTime } from "luxon"

describe("Template Processor", () => {
    const util = TestUtilityMock.getInstance()

    beforeEach(async () => {
        await util.seedDatabase()
    })

    async function createDueTemplate(overrides: Record<string, unknown> = {}) {
        return util.getDatabase().transactionTemplate.create({
            data: {
                name: "Monthly Rent",
                type: TransactionType.EXPENSE,
                amount: 1000,
                frequency: RecurrenceFrequency.MONTHLY,
                startDate: DateTime.now().minus({ months: 1 }).toJSDate(),
                nextDueDate: DateTime.now().minus({ hours: 1 }).toJSDate(),
                isActive: true,
                accountId: util.getTestData().accounts.standard.id,
                householdId: util.getTestData().households.standard.id,
                ...overrides
            }
        })
    }

    test("creates a transaction for a due template", async () => {
        const template = await createDueTemplate()

        await processTransactionTemplates()

        const transactions = await util.getDatabase().transaction.findMany({
            where: { transactionTemplateId: template.id }
        })

        expect(transactions).toHaveLength(1)
        expect(transactions[0].name).toBe(template.name)
        expect(transactions[0].accountId).toBe(template.accountId)
        expect(transactions[0].type).toBe(TransactionType.EXPENSE)
    })

    test("stores expense amount as negative value", async () => {
        const template = await createDueTemplate({ type: TransactionType.EXPENSE, amount: 1000 })

        await processTransactionTemplates()

        const transactions = await util.getDatabase().transaction.findMany({
            where: { transactionTemplateId: template.id }
        })

        expect(transactions[0].amount).toBe(-1000)
    })

    test("stores income amount as positive value", async () => {
        const template = await createDueTemplate({ type: TransactionType.INCOME, amount: 3000, name: "Monthly Salary" })

        await processTransactionTemplates()

        const transactions = await util.getDatabase().transaction.findMany({
            where: { transactionTemplateId: template.id }
        })

        expect(transactions[0].amount).toBe(3000)
    })

    test("advances nextDueDate by 1 day for DAILY frequency", async () => {
        const baseDate = DateTime.now().minus({ hours: 1 })
        const template = await createDueTemplate({
            frequency: RecurrenceFrequency.DAILY,
            nextDueDate: baseDate.toJSDate()
        })

        await processTransactionTemplates()

        const updated = await util.getDatabase().transactionTemplate.findFirst({ where: { id: template.id } })
        const expectedDate = baseDate.plus({ days: 1 })

        expect(DateTime.fromJSDate(updated!.nextDueDate).toFormat("yyyy-MM-dd"))
            .toBe(expectedDate.toFormat("yyyy-MM-dd"))
    })

    test("advances nextDueDate by 1 week for WEEKLY frequency", async () => {
        const baseDate = DateTime.now().minus({ hours: 1 })
        const template = await createDueTemplate({
            frequency: RecurrenceFrequency.WEEKLY,
            nextDueDate: baseDate.toJSDate()
        })

        await processTransactionTemplates()

        const updated = await util.getDatabase().transactionTemplate.findFirst({ where: { id: template.id } })
        const expectedDate = baseDate.plus({ weeks: 1 })

        expect(DateTime.fromJSDate(updated!.nextDueDate).toFormat("yyyy-MM-dd"))
            .toBe(expectedDate.toFormat("yyyy-MM-dd"))
    })

    test("advances nextDueDate by 1 month for MONTHLY frequency", async () => {
        const baseDate = DateTime.now().minus({ hours: 1 })
        const template = await createDueTemplate({
            frequency: RecurrenceFrequency.MONTHLY,
            nextDueDate: baseDate.toJSDate()
        })

        await processTransactionTemplates()

        const updated = await util.getDatabase().transactionTemplate.findFirst({ where: { id: template.id } })
        const expectedDate = baseDate.plus({ months: 1 })

        expect(DateTime.fromJSDate(updated!.nextDueDate).toFormat("yyyy-MM"))
            .toBe(expectedDate.toFormat("yyyy-MM"))
    })

    test("advances nextDueDate by 1 year for YEARLY frequency", async () => {
        const baseDate = DateTime.now().minus({ hours: 1 })
        const template = await createDueTemplate({
            frequency: RecurrenceFrequency.YEARLY,
            nextDueDate: baseDate.toJSDate()
        })

        await processTransactionTemplates()

        const updated = await util.getDatabase().transactionTemplate.findFirst({ where: { id: template.id } })
        const expectedDate = baseDate.plus({ years: 1 })

        expect(DateTime.fromJSDate(updated!.nextDueDate).toFormat("yyyy"))
            .toBe(expectedDate.toFormat("yyyy"))
    })

    test("does not process inactive templates", async () => {
        const template = await createDueTemplate({ isActive: false })

        await processTransactionTemplates()

        const transactions = await util.getDatabase().transaction.findMany({
            where: { transactionTemplateId: template.id }
        })

        expect(transactions).toHaveLength(0)
    })

    test("does not process templates not yet due", async () => {
        const template = await createDueTemplate({
            nextDueDate: DateTime.now().plus({ days: 1 }).toJSDate()
        })

        await processTransactionTemplates()

        const transactions = await util.getDatabase().transaction.findMany({
            where: { transactionTemplateId: template.id }
        })

        expect(transactions).toHaveLength(0)
    })

    test("deactivates template when next due date exceeds end date", async () => {
        const template = await createDueTemplate({
            frequency: RecurrenceFrequency.MONTHLY,
            nextDueDate: DateTime.now().minus({ hours: 1 }).toJSDate(),
            endDate: DateTime.now().plus({ days: 5 }).toJSDate() // end date before next occurrence
        })

        await processTransactionTemplates()

        const updated = await util.getDatabase().transactionTemplate.findFirst({ where: { id: template.id } })
        expect(updated!.isActive).toBe(false)
    })

    test("keeps template active when end date is not yet reached", async () => {
        const template = await createDueTemplate({
            endDate: DateTime.now().plus({ years: 1 }).toJSDate()
        })

        await processTransactionTemplates()

        const updated = await util.getDatabase().transactionTemplate.findFirst({ where: { id: template.id } })
        expect(updated!.isActive).toBe(true)
    })

    test("uses nextDueDate as the transaction valueDate", async () => {
        const dueDate = DateTime.now().minus({ hours: 2 }).startOf("minute").toJSDate()
        const template = await createDueTemplate({ nextDueDate: dueDate })

        await processTransactionTemplates()

        const transactions = await util.getDatabase().transaction.findMany({
            where: { transactionTemplateId: template.id }
        })

        expect(transactions[0].valueDate.getTime()).toBe(dueDate.getTime())
    })
})