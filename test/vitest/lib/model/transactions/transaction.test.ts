import { describe, expect, test } from "vitest"
import createTransaction from "@/src/lib/model/transactions/mutations/createTransaction"
import updateTransaction from "@/src/lib/model/transactions/mutations/updateTransaction"
import deleteTransaction from "@/src/lib/model/transactions/mutations/deleteTransaction"
import getTransaction from "@/src/lib/model/transactions/queries/getTransaction"
import getTransactions from "@/src/lib/model/transactions/queries/getTransactions"
import TestUtilityMock from "@/test/utility/TestUtilityMock"
import { TransactionType } from "@prisma/client"
import { DateTime } from "luxon"

describe("Transaction Mutations & Queries", () => {
    const util = TestUtilityMock.getInstance()

    beforeEach(async () => {
        await util.seedDatabase()
    })

    describe("get", () => {
        test("get all transactions with pagination", async () => {
            const { transactions, count } = await getTransactions({
                where: { accountId: util.getTestData().accounts.standard.id },
                householdId: util.getTestData().households.standard.id
            }, util.getMockContext())

            expect(transactions).toBeDefined()
            expect(count).toBeGreaterThanOrEqual(0)
        })

        test("get specific transaction by ID", async () => {
            const transaction = await getTransaction({ id: util.getTestData().transactions.standard.income.id }, util.getMockContext())

            expect(transaction.id).toBe(util.getTestData().transactions.standard.income.id)
            expect(transaction.category).toBeDefined()
            expect(transaction.account).toBeDefined()
        })

        test("includes createdBy in transaction query", async () => {
            // First create a transaction with a known creator
            const ctx = util.getMockContext("standard")
            const created = await createTransaction({
                name: "Test With Creator",
                accountId: util.getTestData().accounts.standard.id,
                categoryId: null,
                type: TransactionType.INCOME,
                valueDate: DateTime.now().toJSDate(),
                amount: 100,
                description: null,
                counterpartyId: null
            }, ctx)

            // Then fetch it and verify createdBy is included
            const transaction = await getTransaction({ id: created.id }, ctx)

            expect(transaction.createdBy).toBeDefined()
            expect(transaction.createdBy?.id).toBe(util.getTestData().users.standard.id)
            expect(transaction.createdBy?.firstName).toBe(util.getTestData().users.standard.firstName)
            expect(transaction.createdBy?.lastName).toBe(util.getTestData().users.standard.lastName)
        })

        test("get only own transactions", async () => {
            const { transactions } = await getTransactions({ householdId: util.getTestData().households.standard.id }, util.getMockContext())

            expect(transactions).toHaveLength(2)
        })
    })

    describe("create", () => {
        test("creates a new income transaction successfully", async () => {
            const transactionData = {
                name: "Test Income",
                accountId: util.getTestData().accounts.standard.id,
                categoryId: util.getTestData().categories.standard.income.id,
                type: TransactionType.INCOME,
                valueDate: DateTime.now().toJSDate(),
                amount: 500,
                description: "Test income transaction",
                counterpartyId: null
            }

            const result = await createTransaction(transactionData, util.getMockContext())

            expect(result.id).not.toBeUndefined()
            expect(result.name).toBe("Test Income")
            expect(result.amount).toBe(500) // Positive for income
        })

        test("creates a new expense transaction successfully", async () => {
            const transactionData = {
                name: "Test Expense",
                accountId: util.getTestData().accounts.standard.id,
                categoryId: util.getTestData().categories.standard.livingCosts.id,
                type: TransactionType.EXPENSE,
                valueDate: DateTime.now().toJSDate(),
                amount: 300,
                description: "Test expense transaction",
                counterpartyId: null
            }

            const result = await createTransaction(transactionData, util.getMockContext())

            expect(result.id).not.toBeUndefined()
            expect(result.name).toBe("Test Expense")
            expect(result.amount).toBe(-300) // Negative for expense
        })

        test("creates a transaction without category", async () => {
            const result = await createTransaction({
                name: "No Category",
                accountId: util.getTestData().accounts.standard.id,
                categoryId: null,
                type: TransactionType.INCOME,
                valueDate: DateTime.now().toJSDate(),
                amount: 100,
                description: null,
                counterpartyId: null
            }, util.getMockContext())

            expect(result.id).not.toBeUndefined()
            expect(result.categoryId).toBeNull()
        })

        test("fails with invalid data", async () => {
            await expect(async () => createTransaction({
                name: "",
                accountId: "invalid-uuid",
                categoryId: null,
                type: TransactionType.INCOME,
                valueDate: DateTime.now().toJSDate(),
                amount: 100,
                description: null,
                counterpartyId: null
            }, util.getMockContext())).rejects.toThrowError()
        })

        test("sets createdById to current user", async () => {
            const ctx = util.getMockContext("standard")
            const transactionData = {
                name: "Test CreatedBy",
                accountId: util.getTestData().accounts.standard.id,
                categoryId: util.getTestData().categories.standard.income.id,
                type: TransactionType.INCOME,
                valueDate: DateTime.now().toJSDate(),
                amount: 100,
                description: null,
                counterpartyId: null
            }

            const result = await createTransaction(transactionData, ctx)

            expect(result.createdById).toBe(util.getTestData().users.standard.id)
        })
    })

    describe("update", () => {
        test("updates a transaction successfully", async () => {
            const originalTransaction = util.getTestData().transactions.standard.income

            const result = await updateTransaction({
                id: originalTransaction.id,
                name: "Updated Transaction",
                accountId: originalTransaction.accountId,
                categoryId: originalTransaction.categoryId,
                type: originalTransaction.type,
                valueDate: DateTime.now().toJSDate(),
                amount: 250,
                description: "Updated description",
                counterpartyId: null
            }, util.getMockContext())

            expect(result.name).toBe("Updated Transaction")
            expect(result.description).toBe("Updated description")

            // Check amount sign based on transaction type
            if (result.type === TransactionType.EXPENSE) {
                expect(result.amount).toBe(-250)
            } else {
                expect(result.amount).toBe(250)
            }
        })

        test("changes transaction type from income to expense", async () => {
            // Create income transaction first
            const income = await createTransaction({
                name: "Income to change",
                accountId: util.getTestData().accounts.standard.id,
                categoryId: util.getTestData().categories.standard.income.id,
                type: TransactionType.INCOME,
                valueDate: DateTime.now().toJSDate(),
                amount: 100,
                description: null,
                counterpartyId: null
            }, util.getMockContext())

            expect(income.amount).toBe(100) // Positive for income

            // Update to expense
            const updated = await updateTransaction({
                id: income.id,
                name: income.name,
                accountId: income.accountId,
                categoryId: util.getTestData().categories.standard.livingCosts.id,
                type: TransactionType.EXPENSE,
                valueDate: DateTime.now().toJSDate(),
                amount: 100,
                description: null,
                counterpartyId: null
            }, util.getMockContext())

            expect(updated.amount).toBe(-100) // Should now be negative
        })

        test("fails to update non-existing transaction", async () => {
            await expect(async () => updateTransaction({
                id: "non-existent-id",
                name: "Invalid",
                accountId: util.getTestData().accounts.standard.id,
                categoryId: null,
                type: TransactionType.INCOME,
                valueDate: DateTime.now().toJSDate(),
                amount: 100,
                description: null,
                counterpartyId: null
            }, util.getMockContext())).rejects.toThrowError()
        })
    })

    describe("delete", () => {
        test("deletes a transaction successfully", async () => {
            await deleteTransaction({ id: util.getTestData().transactions.standard.expense.id }, util.getMockContext())

            await expect(async () => getTransaction(
                { id: util.getTestData().transactions.standard.expense.id },
                util.getMockContext()
            )).rejects.toThrowError()
        })

        test("fails to delete non-existing transaction", async () => {
            await expect(async () => deleteTransaction({ id: "non-existent-id" }, util.getMockContext()))
                .rejects.toThrowError()
        })
    })
})
