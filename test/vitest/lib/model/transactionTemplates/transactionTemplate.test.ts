import { beforeEach, describe, expect, test } from "vitest"
import TestUtilityMock from "@/test/utility/TestUtilityMock"
import { RecurrenceFrequency, TransactionType } from "@prisma/client"
import { DateTime } from "luxon"
import createTransactionTemplate from "@/src/lib/model/transactionTemplates/mutations/createTransactionTemplate"
import updateTransactionTemplate from "@/src/lib/model/transactionTemplates/mutations/updateTransactionTemplate"
import deleteTransactionTemplate from "@/src/lib/model/transactionTemplates/mutations/deleteTransactionTemplate"
import toggleTransactionTemplate from "@/src/lib/model/transactionTemplates/mutations/toggleTransactionTemplate"
import getTransactionTemplate from "@/src/lib/model/transactionTemplates/queries/getTransactionTemplate"
import getTransactionTemplates from "@/src/lib/model/transactionTemplates/queries/getTransactionTemplates"

describe("Transaction Template Mutations & Queries", () => {
    const util = TestUtilityMock.getInstance()

    beforeEach(async () => {
        await util.seedDatabase()
    })

    async function createTestTemplate() {
        return createTransactionTemplate({
            name: "Monthly Rent",
            type: TransactionType.EXPENSE,
            amount: 1000,
            frequency: RecurrenceFrequency.MONTHLY,
            startDate: DateTime.now().toJSDate(),
            accountId: util.getTestData().accounts.standard.id
        }, util.getMockContext())
    }

    describe("create", () => {
        test("creates a template successfully", async () => {
            const startDate = DateTime.now().toJSDate()

            const result = await createTransactionTemplate({
                name: "Monthly Salary",
                type: TransactionType.INCOME,
                amount: 3000,
                frequency: RecurrenceFrequency.MONTHLY,
                startDate,
                accountId: util.getTestData().accounts.standard.id
            }, util.getMockContext())

            expect(result.id).toBeDefined()
            expect(result.name).toBe("Monthly Salary")
            expect(result.type).toBe(TransactionType.INCOME)
            expect(result.amount).toBe(3000)
            expect(result.frequency).toBe(RecurrenceFrequency.MONTHLY)
            expect(result.isActive).toBe(true)
        })

        test("sets nextDueDate equal to startDate on creation", async () => {
            const startDate = DateTime.now().startOf("day").toJSDate()

            const result = await createTransactionTemplate({
                name: "Weekly Groceries",
                type: TransactionType.EXPENSE,
                amount: 100,
                frequency: RecurrenceFrequency.WEEKLY,
                startDate,
                accountId: util.getTestData().accounts.standard.id
            }, util.getMockContext())

            expect(result.nextDueDate.getTime()).toBe(startDate.getTime())
        })

        test("sets householdId from the linked account", async () => {
            const result = await createTransactionTemplate({
                name: "Yearly Insurance",
                type: TransactionType.EXPENSE,
                amount: 500,
                frequency: RecurrenceFrequency.YEARLY,
                startDate: DateTime.now().toJSDate(),
                accountId: util.getTestData().accounts.standard.id
            }, util.getMockContext())

            expect(result.householdId).toBe(util.getTestData().households.standard.id)
        })

        test("throws an error if account does not exist", async () => {
            await expect(createTransactionTemplate({
                name: "Test",
                type: TransactionType.INCOME,
                amount: 100,
                frequency: RecurrenceFrequency.MONTHLY,
                startDate: DateTime.now().toJSDate(),
                accountId: "00000000-0000-0000-0000-000000000000"
            }, util.getMockContext())).rejects.toThrowError()
        })

        test("fails with invalid data", async () => {
            await expect(createTransactionTemplate({
                name: "",
                type: TransactionType.INCOME,
                amount: -100, // Must be positive
                frequency: RecurrenceFrequency.MONTHLY,
                startDate: DateTime.now().toJSDate(),
                accountId: util.getTestData().accounts.standard.id
            }, util.getMockContext())).rejects.toThrowError()
        })
    })

    describe("update", () => {
        test("updates a template successfully", async () => {
            const template = await createTestTemplate()

            const result = await updateTransactionTemplate({
                id: template.id,
                name: "Updated Rent",
                type: template.type,
                amount: 1200,
                frequency: template.frequency,
                startDate: template.startDate,
                accountId: template.accountId
            }, util.getMockContext())

            expect(result.name).toBe("Updated Rent")
            expect(result.amount).toBe(1200)
        })

        test("resets nextDueDate when startDate changes", async () => {
            const template = await createTestTemplate()
            const newStartDate = DateTime.now().plus({ days: 10 }).toJSDate()

            const result = await updateTransactionTemplate({
                id: template.id,
                name: template.name,
                type: template.type,
                amount: template.amount,
                frequency: template.frequency,
                startDate: newStartDate,
                accountId: template.accountId
            }, util.getMockContext())

            expect(result.nextDueDate.getTime()).toBe(newStartDate.getTime())
        })

        test("preserves nextDueDate when startDate is unchanged", async () => {
            const template = await createTestTemplate()
            const originalNextDueDate = template.nextDueDate

            const result = await updateTransactionTemplate({
                id: template.id,
                name: "Changed Name Only",
                type: template.type,
                amount: template.amount,
                frequency: template.frequency,
                startDate: template.startDate,
                accountId: template.accountId
            }, util.getMockContext())

            expect(result.nextDueDate.getTime()).toBe(originalNextDueDate.getTime())
        })

        test("throws an error when template does not exist", async () => {
            await expect(updateTransactionTemplate({
                id: "00000000-0000-0000-0000-000000000000",
                name: "Ghost Template",
                type: TransactionType.INCOME,
                amount: 100,
                frequency: RecurrenceFrequency.MONTHLY,
                startDate: DateTime.now().toJSDate(),
                accountId: util.getTestData().accounts.standard.id
            }, util.getMockContext())).rejects.toThrowError()
        })
    })

    describe("delete", () => {
        test("deletes a template successfully", async () => {
            const template = await createTestTemplate()

            await deleteTransactionTemplate({ id: template.id }, util.getMockContext())

            await expect(
                getTransactionTemplate({ id: template.id }, util.getMockContext())
            ).rejects.toThrowError()
        })

        test("throws an error when template does not exist", async () => {
            await expect(
                deleteTransactionTemplate({ id: "00000000-0000-0000-0000-000000000000" }, util.getMockContext())
            ).rejects.toThrowError()
        })
    })

    describe("toggle", () => {
        test("deactivates an active template", async () => {
            const template = await createTestTemplate()
            expect(template.isActive).toBe(true)

            const result = await toggleTransactionTemplate(
                { id: template.id, isActive: false },
                util.getMockContext()
            )

            expect(result.isActive).toBe(false)
        })

        test("reactivates an inactive template", async () => {
            const template = await createTestTemplate()
            await toggleTransactionTemplate({ id: template.id, isActive: false }, util.getMockContext())

            const result = await toggleTransactionTemplate(
                { id: template.id, isActive: true },
                util.getMockContext()
            )

            expect(result.isActive).toBe(true)
        })
    })

    describe("getTransactionTemplates", () => {
        test("returns templates for the current household", async () => {
            await createTestTemplate()

            const { transactionTemplates, count } = await getTransactionTemplates(
                { householdId: util.getTestData().households.standard.id },
                util.getMockContext()
            )

            expect(transactionTemplates.length).toBeGreaterThan(0)
            expect(count).toBeGreaterThan(0)
        })

        test("includes account, category and counterparty relations", async () => {
            await createTestTemplate()

            const { transactionTemplates } = await getTransactionTemplates(
                { householdId: util.getTestData().households.standard.id },
                util.getMockContext()
            )

            const template = transactionTemplates[0]
            expect(template).toHaveProperty("account")
            expect(template).toHaveProperty("category")
            expect(template).toHaveProperty("counterparty")
        })

        test("returns templates ordered by name ascending by default", async () => {
            await createTransactionTemplate({
                name: "Zzz Template",
                type: TransactionType.INCOME,
                amount: 100,
                frequency: RecurrenceFrequency.MONTHLY,
                startDate: DateTime.now().toJSDate(),
                accountId: util.getTestData().accounts.standard.id
            }, util.getMockContext())

            await createTransactionTemplate({
                name: "Aaa Template",
                type: TransactionType.INCOME,
                amount: 200,
                frequency: RecurrenceFrequency.MONTHLY,
                startDate: DateTime.now().toJSDate(),
                accountId: util.getTestData().accounts.standard.id
            }, util.getMockContext())

            const { transactionTemplates } = await getTransactionTemplates(
                { householdId: util.getTestData().households.standard.id },
                util.getMockContext()
            )

            const names = transactionTemplates.map(t => t.name)
            expect(names.indexOf("Aaa Template")).toBeLessThan(names.indexOf("Zzz Template"))
        })
    })

    describe("getTransactionTemplate", () => {
        test("returns a template with all relations", async () => {
            const created = await createTestTemplate()

            const template = await getTransactionTemplate({ id: created.id }, util.getMockContext())

            expect(template.id).toBe(created.id)
            expect(template.name).toBe(created.name)
            expect(template.account).toBeDefined()
            expect(template.category).toBeDefined()
            expect(template.counterparty).toBeDefined()
        })

        test("throws an error when template does not exist", async () => {
            await expect(
                getTransactionTemplate({ id: "00000000-0000-0000-0000-000000000000" }, util.getMockContext())
            ).rejects.toThrowError()
        })
    })
})