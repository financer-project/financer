import { beforeEach, describe, expect, it } from "vitest"
import TestUtilityMock from "@/test/utility/TestUtilityMock"
import db from "@/src/lib/db"
import { DateTime } from "luxon"
import { RecurrenceFrequency, TransactionType } from "@prisma/client"
import deleteTransactionTemplate from "@/src/lib/model/transactionTemplates/mutations/deleteTransactionTemplate"
import deleteCategory from "@/src/lib/model/categories/mutations/deleteCategory"
import deleteCounterparty from "@/src/lib/model/counterparties/mutations/deleteCounterparty"

describe("Transaction Template Migration", () => {
    const utils = TestUtilityMock.getInstance()

    beforeEach(async () => {
        await utils.seedDatabase()
    })

    async function createTemplate(overrides: Record<string, unknown> = {}) {
        return utils.getDatabase().transactionTemplate.create({
            data: {
                name: "Monthly Rent",
                type: TransactionType.EXPENSE,
                amount: 1000,
                frequency: RecurrenceFrequency.MONTHLY,
                startDate: DateTime.now().toJSDate(),
                nextDueDate: DateTime.now().toJSDate(),
                isActive: true,
                accountId: utils.getTestData().accounts.standard.id,
                householdId: utils.getTestData().households.standard.id,
                ...overrides
            }
        })
    }

    describe("Schema Structure", () => {
        it("TransactionTemplate has all required fields", async () => {
            const template = await createTemplate()

            const found = await db.transactionTemplate.findFirst({ where: { id: template.id } })

            expect(found).not.toBeNull()
            expect("id" in found!).toBe(true)
            expect("name" in found!).toBe(true)
            expect("type" in found!).toBe(true)
            expect("amount" in found!).toBe(true)
            expect("frequency" in found!).toBe(true)
            expect("startDate" in found!).toBe(true)
            expect("endDate" in found!).toBe(true)
            expect("nextDueDate" in found!).toBe(true)
            expect("isActive" in found!).toBe(true)
            expect("accountId" in found!).toBe(true)
            expect("categoryId" in found!).toBe(true)
            expect("counterpartyId" in found!).toBe(true)
            expect("householdId" in found!).toBe(true)
            expect("createdById" in found!).toBe(true)
        })

        it("TransactionTemplate.isActive defaults to true", async () => {
            const template = await createTemplate()

            expect(template.isActive).toBe(true)
        })

        it("TransactionTemplate.endDate and categoryId and counterpartyId are nullable", async () => {
            const template = await createTemplate()

            expect(template.endDate).toBeNull()
            expect(template.categoryId).toBeNull()
            expect(template.counterpartyId).toBeNull()
        })

        it("Transaction has transactionTemplateId field", async () => {
            const transaction = await db.transaction.findFirst({
                where: { accountId: utils.getTestData().accounts.standard.id }
            })

            expect(transaction).not.toBeNull()
            expect("transactionTemplateId" in transaction!).toBe(true)
        })

        it("Transaction.transactionTemplateId is nullable", async () => {
            const transaction = await db.transaction.findFirst({
                where: { accountId: utils.getTestData().accounts.standard.id }
            })

            // Seeded transactions are not linked to templates
            expect(transaction!.transactionTemplateId).toBeNull()
        })

        it("AdminSettings has transactionTemplateCronTime field with default '00:00'", async () => {
            const settings = await db.adminSettings.findFirst()

            expect(settings).not.toBeNull()
            expect("transactionTemplateCronTime" in settings!).toBe(true)
            expect(settings!.transactionTemplateCronTime).toBe("00:00")
        })
    })

    describe("Referential Integrity", () => {
        it("deleting a template sets transactionTemplateId to null on linked transactions (onDelete: SetNull)", async () => {
            const template = await createTemplate()

            // Create a transaction linked to the template
            const transaction = await db.transaction.create({
                data: {
                    name: "Rent payment",
                    type: TransactionType.EXPENSE,
                    amount: -1000,
                    valueDate: DateTime.now().toJSDate(),
                    accountId: utils.getTestData().accounts.standard.id,
                    transactionTemplateId: template.id
                }
            })

            expect(transaction.transactionTemplateId).toBe(template.id)

            // Delete the template
            await deleteTransactionTemplate({ id: template.id }, utils.getMockContext())

            // Transaction should still exist but with null templateId
            const updatedTransaction = await db.transaction.findFirst({ where: { id: transaction.id } })
            expect(updatedTransaction).not.toBeNull()
            expect(updatedTransaction!.transactionTemplateId).toBeNull()
        })

        it("deleting a category sets categoryId to null on linked templates (onDelete: SetNull)", async () => {
            const categoryId = utils.getTestData().categories.standard.livingCosts.id
            const template = await createTemplate({ categoryId })

            expect(template.categoryId).toBe(categoryId)

            // Delete the category
            await deleteCategory({ id: categoryId }, utils.getMockContext())

            // Template should still exist but with null categoryId
            const updatedTemplate = await db.transactionTemplate.findFirst({ where: { id: template.id } })
            expect(updatedTemplate).not.toBeNull()
            expect(updatedTemplate!.categoryId).toBeNull()
        })

        it("deleting a counterparty sets counterpartyId to null on linked templates (onDelete: SetNull)", async () => {
            const counterpartyId = utils.getTestData().counterparties.standard.merchant.id
            const template = await createTemplate({ counterpartyId })

            expect(template.counterpartyId).toBe(counterpartyId)

            // Delete the counterparty
            await deleteCounterparty({ id: counterpartyId }, utils.getMockContext())

            // Template should still exist but with null counterpartyId
            const updatedTemplate = await db.transactionTemplate.findFirst({ where: { id: template.id } })
            expect(updatedTemplate).not.toBeNull()
            expect(updatedTemplate!.counterpartyId).toBeNull()
        })
    })

    describe("Template-Transaction Linkage", () => {
        it("a transaction can be linked to a template", async () => {
            const template = await createTemplate()

            const transaction = await db.transaction.create({
                data: {
                    name: "Rent payment",
                    type: TransactionType.EXPENSE,
                    amount: -1000,
                    valueDate: DateTime.now().toJSDate(),
                    accountId: utils.getTestData().accounts.standard.id,
                    transactionTemplateId: template.id
                }
            })

            expect(transaction.transactionTemplateId).toBe(template.id)

            const found = await db.transactionTemplate.findFirst({
                where: { id: template.id },
                include: { transactions: true }
            })

            expect(found!.transactions).toHaveLength(1)
            expect(found!.transactions[0].id).toBe(transaction.id)
        })

        it("multiple transactions can be linked to the same template", async () => {
            const template = await createTemplate()

            await db.transaction.createMany({
                data: [
                    {
                        name: "Rent January",
                        type: TransactionType.EXPENSE,
                        amount: -1000,
                        valueDate: DateTime.now().minus({ months: 2 }).toJSDate(),
                        accountId: utils.getTestData().accounts.standard.id,
                        transactionTemplateId: template.id
                    },
                    {
                        name: "Rent February",
                        type: TransactionType.EXPENSE,
                        amount: -1000,
                        valueDate: DateTime.now().minus({ months: 1 }).toJSDate(),
                        accountId: utils.getTestData().accounts.standard.id,
                        transactionTemplateId: template.id
                    }
                ]
            })

            const found = await db.transactionTemplate.findFirst({
                where: { id: template.id },
                include: { transactions: true }
            })

            expect(found!.transactions).toHaveLength(2)
        })
    })
})
