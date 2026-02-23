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
import getSuggestedTemplates from "@/src/lib/model/transactions/queries/getSuggestedTemplates"
import { suggestionKey } from "@/src/lib/model/transactions/services/recurringTransactionDetector"
import db from "@/src/lib/db"

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

    describe("suggestions", () => {
        const householdId = () => util.getTestData().households.standard.id
        const accountId = () => util.getTestData().accounts.standard.id
        const ctx = () => util.getMockContext("standard", { currentHouseholdId: householdId() })

        async function seedMonthlyTransactions(name: string, amount: number, type: TransactionType, count = 3) {
            const signed = type === TransactionType.EXPENSE ? -Math.abs(amount) : Math.abs(amount)
            for (let i = 0; i < count; i++) {
                await db.transaction.create({
                    data: {
                        name,
                        type,
                        amount: signed,
                        valueDate: DateTime.now().minus({ months: count - 1 - i }).startOf("day").toJSDate(),
                        accountId: accountId()
                    }
                })
            }
        }

        describe("getSuggestedTemplates", () => {
            test("returns a suggestion for a recurring transaction pattern", async () => {
                await seedMonthlyTransactions("Streaming", 15, TransactionType.EXPENSE)

                const suggestions = await getSuggestedTemplates(null, ctx())

                expect(suggestions.find(s => s.name === "Streaming")).toBeDefined()
            })

            test("suggestion is removed once a matching template is created", async () => {
                await seedMonthlyTransactions("Electricity", 90, TransactionType.EXPENSE)

                const before = await getSuggestedTemplates(null, ctx())
                expect(before.find(s => s.name === "Electricity")).toBeDefined()

                await createTransactionTemplate({
                    name: "Electricity",
                    type: TransactionType.EXPENSE,
                    amount: 90,
                    frequency: RecurrenceFrequency.MONTHLY,
                    startDate: DateTime.now().toJSDate(),
                    accountId: accountId()
                }, ctx())

                const after = await getSuggestedTemplates(null, ctx())
                expect(after.find(s => s.name === "Electricity")).toBeUndefined()
            })

            test("suggestion reappears after the matching template is deleted", async () => {
                await seedMonthlyTransactions("Water Bill", 25, TransactionType.EXPENSE)

                const template = await createTransactionTemplate({
                    name: "Water Bill",
                    type: TransactionType.EXPENSE,
                    amount: 25,
                    frequency: RecurrenceFrequency.MONTHLY,
                    startDate: DateTime.now().toJSDate(),
                    accountId: accountId()
                }, ctx())

                const afterCreate = await getSuggestedTemplates(null, ctx())
                expect(afterCreate.find(s => s.name === "Water Bill")).toBeUndefined()

                await deleteTransactionTemplate({ id: template.id }, ctx())

                const afterDelete = await getSuggestedTemplates(null, ctx())
                expect(afterDelete.find(s => s.name === "Water Bill")).toBeDefined()
            })
        })

        describe("suggestionKey (dismiss identity)", () => {
            test("identical suggestions produce the same key", async () => {
                await seedMonthlyTransactions("Rent", 1000, TransactionType.EXPENSE)
                const suggestions = await getSuggestedTemplates(null, ctx())
                const rent = suggestions.find(s => s.name === "Rent")!

                expect(suggestionKey(rent)).toBe(suggestionKey(rent))
            })

            test("suggestions differing only by amount produce different keys", async () => {
                await seedMonthlyTransactions("Sub A", 10, TransactionType.EXPENSE)
                await seedMonthlyTransactions("Sub A", 20, TransactionType.EXPENSE)
                const suggestions = await getSuggestedTemplates(null, ctx())
                const both = suggestions.filter(s => s.name === "Sub A")

                // Two distinct suggestions (different amount) should have different keys
                expect(both.length).toBe(2)
                expect(suggestionKey(both[0])).not.toBe(suggestionKey(both[1]))
            })

            test("suggestions differing only by type produce different keys", async () => {
                await seedMonthlyTransactions("Transfer", 500, TransactionType.INCOME)
                await seedMonthlyTransactions("Transfer", 500, TransactionType.EXPENSE)
                const suggestions = await getSuggestedTemplates(null, ctx())
                const both = suggestions.filter(s => s.name === "Transfer")

                expect(both.length).toBe(2)
                expect(suggestionKey(both[0])).not.toBe(suggestionKey(both[1]))
            })

            test("dismissed key set correctly filters visible suggestions", async () => {
                await seedMonthlyTransactions("Keep Me", 50, TransactionType.EXPENSE)
                await seedMonthlyTransactions("Dismiss Me", 80, TransactionType.EXPENSE)
                const suggestions = await getSuggestedTemplates(null, ctx())

                const dismissMe = suggestions.find(s => s.name === "Dismiss Me")!
                const dismissedKeys = new Set([suggestionKey(dismissMe)])

                const visible = suggestions.filter(s => !dismissedKeys.has(suggestionKey(s)))

                expect(visible.find(s => s.name === "Keep Me")).toBeDefined()
                expect(visible.find(s => s.name === "Dismiss Me")).toBeUndefined()
            })

            test("stale dismissed keys are pruned when suggestion no longer exists", async () => {
                await seedMonthlyTransactions("Gone Soon", 60, TransactionType.EXPENSE)
                const before = await getSuggestedTemplates(null, ctx())
                const goneSoon = before.find(s => s.name === "Gone Soon")!
                const dismissedKeys = new Set([suggestionKey(goneSoon)])

                // Create a template so the suggestion disappears server-side
                await createTransactionTemplate({
                    name: "Gone Soon",
                    type: TransactionType.EXPENSE,
                    amount: 60,
                    frequency: RecurrenceFrequency.MONTHLY,
                    startDate: DateTime.now().toJSDate(),
                    accountId: accountId()
                }, ctx())

                const after = await getSuggestedTemplates(null, ctx())
                const currentKeys = new Set(after.map(suggestionKey))

                // Stale keys = dismissed keys that no longer exist in current suggestions
                const activeKeys = new Set([...dismissedKeys].filter(k => currentKeys.has(k)))
                expect(activeKeys.size).toBe(0)
            })
        })
    })
})