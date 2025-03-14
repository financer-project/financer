import { Account, CategoryType, Household, Transaction } from "@prisma/client"
import db from "@/src/lib/db"
import { AccountSeed } from "@/test/seed/accounts"
import { CategorySeed } from "@/test/seed/categorySeed"
import { Category } from ".prisma/client"

export interface TransactionSeed {
    standard: {
        income: Transaction,
        expense: Transaction,
    },
    admin: {
        income: Transaction,
        expense: Transaction,
    }
}

export default async function seedTransactions(accounts: AccountSeed, categories: CategorySeed): Promise<TransactionSeed> {
    const createIncome = async (account: Account, category: Category) =>
        db.transaction.create({
            data: {
                name: "Income",
                category: { connect: { id: category.id } },
                account: { connect: { id: account.id } },
                type: CategoryType.INCOME,
                amount: 1000
            }
        })

    const createExpense = async (account: Account, category: Category) =>
        db.transaction.create({
            data: {
                name: "Cost of Living",
                category: { connect: { id: category.id } },
                account: { connect: { id: account.id } },
                type: CategoryType.EXPENSE,
                amount: 100
            }
        })

    return {
        standard: {
            income: await createIncome(accounts.standard, categories.standard.income),
            expense: await createExpense(accounts.standard, categories.standard.livingCosts)
        },
        admin: {
            income: await createIncome(accounts.admin, categories.admin.income),
            expense: await createExpense(accounts.admin, categories.admin.livingCosts)
        }
    }
}