import { resolver } from "@blitzjs/rpc"
import db from "src/lib/db"
import { z } from "zod"
import { DateTime } from "luxon"
import { Transaction } from "@prisma/client"

const GetBalanceHistory = z.object({
    startDate: z.date().max(DateTime.now().endOf("month").toJSDate()),
    endDate: z.date().max(DateTime.now().endOf("month").toJSDate()).optional()
})

export interface BalanceHistory {
    month: Date,
    expenses: number
    income: number
}

/**
 * Group transactions by month and calculate income and expenses for each month
 * 
 * @param transactions - List of transactions to process
 * @param startMonth - Start month for the history
 * @param endMonth - End month for the history
 * @returns Array of monthly balance history entries
 */
function calculateMonthlyBalances(
    transactions: Transaction[], 
    startMonth: DateTime, 
    endMonth: DateTime
): BalanceHistory[] {
    // Pre-group transactions by month for better performance
    const transactionsByMonth = new Map<string, Transaction[]>()

    transactions.forEach(transaction => {
        const month = DateTime.fromJSDate(transaction.valueDate).startOf("month")
        const monthKey = month.toFormat("yyyy-MM")

        if (!transactionsByMonth.has(monthKey)) {
            transactionsByMonth.set(monthKey, [])
        }

        transactionsByMonth.get(monthKey)!.push(transaction)
    })

    // Generate monthly balance history
    const balanceHistory: BalanceHistory[] = []
    let currentMonth = startMonth

    while (currentMonth < endMonth) {
        const monthKey = currentMonth.toFormat("yyyy-MM")
        const monthTransactions = transactionsByMonth.get(monthKey) || []

        // Calculate income and expenses for the month
        const income = monthTransactions
            .filter(tx => tx.amount >= 0)
            .reduce((sum, tx) => sum + tx.amount, 0)

        const expenses = monthTransactions
            .filter(tx => tx.amount < 0)
            .reduce((sum, tx) => sum + tx.amount, 0)

        balanceHistory.push({
            month: currentMonth.toJSDate(),
            income,
            expenses
        })

        // Move to next month
        currentMonth = currentMonth.plus({ months: 1 })
    }

    return balanceHistory
}

export default resolver.pipe(
    resolver.zod(GetBalanceHistory),
    resolver.authorize(),
    async ({ startDate, endDate }): Promise<BalanceHistory[]> => {
        // Set default end date if not provided
        endDate ??= DateTime.now().toJSDate()

        // Get all transactions in the date range
        const transactions = await db.transaction.findMany({
            where: { valueDate: { gte: startDate, lte: endDate } }
        })

        // Calculate start and end months for the history
        const startMonth = DateTime.fromJSDate(startDate).startOf("month")
        const endMonth = DateTime.fromJSDate(endDate).startOf("month").plus({ months: 1 })

        // Calculate and return monthly balance history
        return calculateMonthlyBalances(transactions, startMonth, endMonth)
    }
)
