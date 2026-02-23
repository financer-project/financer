import { beforeEach, describe, expect, test } from "vitest"
import TestUtilityMock from "@/test/utility/TestUtilityMock"
import { RecurrenceFrequency, TransactionType } from "@prisma/client"
import { DateTime } from "luxon"
import { detectRecurringTransactions } from "@/src/lib/model/transactions/services/recurringTransactionDetector"
import getSuggestedTemplates from "@/src/lib/model/transactions/queries/getSuggestedTemplates"
import createTransactionTemplate from "@/src/lib/model/transactionTemplates/mutations/createTransactionTemplate"
import db from "@/src/lib/db"

describe("recurringTransactionDetector", () => {
    const util = TestUtilityMock.getInstance()

    beforeEach(async () => {
        await util.seedDatabase()
    })

    async function createTransactionsWithIntervals(
        name: string,
        amount: number,
        type: TransactionType,
        valueDates: Date[]
    ) {
        const accountId = util.getTestData().accounts.standard.id
        const signedAmount = type === TransactionType.EXPENSE ? -Math.abs(amount) : Math.abs(amount)
        for (const valueDate of valueDates) {
            await db.transaction.create({
                data: { name, type, amount: signedAmount, valueDate, accountId }
            })
        }
    }

    function monthlyDates(count: number): Date[] {
        return Array.from({ length: count }, (_, i) =>
            DateTime.now().minus({ months: count - 1 - i }).startOf("day").toJSDate()
        )
    }

    describe("detectRecurringTransactions", () => {
        test("detects monthly recurring transactions", async () => {
            await createTransactionsWithIntervals("Netflix", 15, TransactionType.EXPENSE, monthlyDates(3))
            const householdId = util.getTestData().households.standard.id

            const suggestions = await detectRecurringTransactions(householdId)

            const suggestion = suggestions.find(s => s.name === "Netflix")
            expect(suggestion).toBeDefined()
            expect(suggestion!.frequency).toBe(RecurrenceFrequency.MONTHLY)
        })

        test("detects weekly recurring transactions", async () => {
            const weeklyDates = Array.from({ length: 3 }, (_, i) =>
                DateTime.now().minus({ weeks: 2 - i }).startOf("day").toJSDate()
            )
            await createTransactionsWithIntervals("Weekly Groceries", 80, TransactionType.EXPENSE, weeklyDates)
            const householdId = util.getTestData().households.standard.id

            const suggestions = await detectRecurringTransactions(householdId)

            const suggestion = suggestions.find(s => s.name === "Weekly Groceries")
            expect(suggestion).toBeDefined()
            expect(suggestion!.frequency).toBe(RecurrenceFrequency.WEEKLY)
        })

        test("assigns HIGH confidence for 3+ consistent occurrences", async () => {
            await createTransactionsWithIntervals("Rent Payment", 1000, TransactionType.EXPENSE, monthlyDates(4))
            const householdId = util.getTestData().households.standard.id

            const suggestions = await detectRecurringTransactions(householdId)

            const suggestion = suggestions.find(s => s.name === "Rent Payment")
            expect(suggestion).toBeDefined()
            expect(suggestion!.confidence).toBe("HIGH")
        })

        test("assigns MEDIUM confidence for exactly 2 consistent occurrences", async () => {
            await createTransactionsWithIntervals("Insurance", 200, TransactionType.EXPENSE, monthlyDates(2))
            const householdId = util.getTestData().households.standard.id

            const suggestions = await detectRecurringTransactions(householdId)

            const suggestion = suggestions.find(s => s.name === "Insurance")
            expect(suggestion).toBeDefined()
            expect(suggestion!.confidence).toBe("MEDIUM")
        })

        test("includes all matched transactions in output", async () => {
            await createTransactionsWithIntervals("Monthly Salary", 3000, TransactionType.INCOME, monthlyDates(3))
            const householdId = util.getTestData().households.standard.id

            const suggestions = await detectRecurringTransactions(householdId)

            const suggestion = suggestions.find(s => s.name === "Monthly Salary")
            expect(suggestion).toBeDefined()
            expect(suggestion!.transactions).toHaveLength(3)
            expect(suggestion!.transactions[0]).toHaveProperty("id")
            expect(suggestion!.transactions[0]).toHaveProperty("valueDate")
            expect(suggestion!.transactions[0]).toHaveProperty("amount")
        })

        test("reports amount as absolute value", async () => {
            await createTransactionsWithIntervals("Power Bill", 80, TransactionType.EXPENSE, monthlyDates(3))
            const householdId = util.getTestData().households.standard.id

            const suggestions = await detectRecurringTransactions(householdId)

            const suggestion = suggestions.find(s => s.name === "Power Bill")
            expect(suggestion).toBeDefined()
            expect(suggestion!.amount).toBe(80)
        })

        test("records occurrences count correctly", async () => {
            await createTransactionsWithIntervals("Gym Membership", 50, TransactionType.EXPENSE, monthlyDates(5))
            const householdId = util.getTestData().households.standard.id

            const suggestions = await detectRecurringTransactions(householdId)

            const suggestion = suggestions.find(s => s.name === "Gym Membership")
            expect(suggestion).toBeDefined()
            expect(suggestion!.occurrences).toBe(5)
        })

        test("ignores groups with only one transaction", async () => {
            await db.transaction.create({
                data: {
                    name: "One Time Payment",
                    type: TransactionType.EXPENSE,
                    amount: -500,
                    valueDate: DateTime.now().toJSDate(),
                    accountId: util.getTestData().accounts.standard.id
                }
            })
            const householdId = util.getTestData().households.standard.id

            const suggestions = await detectRecurringTransactions(householdId)

            expect(suggestions.find(s => s.name === "One Time Payment")).toBeUndefined()
        })

        test("excludes transactions already linked to a template", async () => {
            const accountId = util.getTestData().accounts.standard.id
            const householdId = util.getTestData().households.standard.id
            const template = await db.transactionTemplate.create({
                data: {
                    name: "Linked Template",
                    type: TransactionType.EXPENSE,
                    amount: 200,
                    frequency: RecurrenceFrequency.MONTHLY,
                    startDate: DateTime.now().toJSDate(),
                    nextDueDate: DateTime.now().toJSDate(),
                    accountId,
                    householdId,
                    isActive: true
                }
            })
            for (const valueDate of monthlyDates(3)) {
                await db.transaction.create({
                    data: {
                        name: "Linked Transaction",
                        type: TransactionType.EXPENSE,
                        amount: -200,
                        valueDate,
                        accountId,
                        transactionTemplateId: template.id
                    }
                })
            }

            const suggestions = await detectRecurringTransactions(householdId)

            expect(suggestions.find(s => s.name === "Linked Transaction")).toBeUndefined()
        })

        test("excludes suggestions whose name+type matches an existing template", async () => {
            await createTransactionTemplate({
                name: "Streaming Service",
                type: TransactionType.EXPENSE,
                amount: 15,
                frequency: RecurrenceFrequency.MONTHLY,
                startDate: DateTime.now().toJSDate(),
                accountId: util.getTestData().accounts.standard.id
            }, util.getMockContext())
            await createTransactionsWithIntervals("Streaming Service", 15, TransactionType.EXPENSE, monthlyDates(3))
            const householdId = util.getTestData().households.standard.id

            const suggestions = await detectRecurringTransactions(householdId)

            expect(suggestions.find(s => s.name === "Streaming Service")).toBeUndefined()
        })

        test("sorts results: HIGH before MEDIUM before LOW confidence", async () => {
            await createTransactionsWithIntervals("High Conf Item", 100, TransactionType.EXPENSE, monthlyDates(4))
            await createTransactionsWithIntervals("Med Conf Item", 200, TransactionType.EXPENSE, monthlyDates(2))
            const householdId = util.getTestData().households.standard.id

            const suggestions = await detectRecurringTransactions(householdId)

            const highIndex = suggestions.findIndex(s => s.name === "High Conf Item")
            const medIndex = suggestions.findIndex(s => s.name === "Med Conf Item")
            expect(highIndex).toBeGreaterThanOrEqual(0)
            expect(medIndex).toBeGreaterThanOrEqual(0)
            expect(highIndex).toBeLessThan(medIndex)
        })

        test("does not return suggestions for other households", async () => {
            const adminAccountId = util.getTestData().accounts.admin.id
            const signedAmount = -Math.abs(75)
            for (const valueDate of monthlyDates(3)) {
                await db.transaction.create({
                    data: { name: "Admin Only Expense", type: TransactionType.EXPENSE, amount: signedAmount, valueDate, accountId: adminAccountId }
                })
            }
            const standardHouseholdId = util.getTestData().households.standard.id

            const suggestions = await detectRecurringTransactions(standardHouseholdId)

            expect(suggestions.find(s => s.name === "Admin Only Expense")).toBeUndefined()
        })
    })

    describe("getSuggestedTemplates query", () => {
        test("returns suggestions for the authenticated user's household", async () => {
            const householdId = util.getTestData().households.standard.id
            await createTransactionsWithIntervals("Monthly Gym", 50, TransactionType.EXPENSE, monthlyDates(3))

            const suggestions = await getSuggestedTemplates(
                null,
                util.getMockContext("standard", { currentHouseholdId: householdId })
            )

            const suggestion = suggestions.find(s => s.name === "Monthly Gym")
            expect(suggestion).toBeDefined()
        })

        test("excludes suggestions after matching template is created", async () => {
            const householdId = util.getTestData().households.standard.id
            await createTransactionsWithIntervals("Phone Plan", 30, TransactionType.EXPENSE, monthlyDates(3))
            const ctx = util.getMockContext("standard", { currentHouseholdId: householdId })

            let suggestions = await getSuggestedTemplates(null, ctx)
            expect(suggestions.find(s => s.name === "Phone Plan")).toBeDefined()

            await createTransactionTemplate({
                name: "Phone Plan",
                type: TransactionType.EXPENSE,
                amount: 30,
                frequency: RecurrenceFrequency.MONTHLY,
                startDate: DateTime.now().toJSDate(),
                accountId: util.getTestData().accounts.standard.id
            }, ctx)

            suggestions = await getSuggestedTemplates(null, ctx)
            expect(suggestions.find(s => s.name === "Phone Plan")).toBeUndefined()
        })

        test("returns an array (empty or populated)", async () => {
            const householdId = util.getTestData().households.standard.id
            const suggestions = await getSuggestedTemplates(
                null,
                util.getMockContext("standard", { currentHouseholdId: householdId })
            )

            expect(Array.isArray(suggestions)).toBe(true)
        })
    })
})
