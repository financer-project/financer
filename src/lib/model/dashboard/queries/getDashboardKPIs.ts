import { resolver } from "@blitzjs/rpc"
import db from "src/lib/db"
import { z } from "zod"
import { DateTime } from "luxon"
import { Transaction } from "@prisma/client"

const GetDashboardKPIs = z.object({
    startDate: z.date().max(DateTime.now().endOf("month").toJSDate()),
    endDate: z.date().max(DateTime.now().endOf("month").toJSDate()).optional(),
    previousPeriod: z.boolean().default(true) // Whether to include data for the previous period (for trend calculation)
})

export interface DashboardKPIs {
    currentBalance: number
    previousBalance?: number // For trend calculation
    transactionCount: number
    previousTransactionCount?: number // For trend calculation
    totalIncome: number
    previousIncome?: number // For trend calculation
    totalExpenses: number
    previousExpenses?: number // For trend calculation
}

/**
 * Calculate financial metrics from a list of transactions
 */
interface FinancialMetrics {
    balance: number
    transactionCount: number
    income: number
    expenses: number
}

/**
 * Calculate financial metrics from a list of transactions
 */
function calculateFinancialMetrics(transactions: Transaction[]): FinancialMetrics {
    const balance = transactions.reduce((sum, tx) => sum + tx.amount, 0)
    const income = transactions
        .filter(tx => tx.amount > 0)
        .reduce((sum, tx) => sum + tx.amount, 0)
    const expenses = transactions
        .filter(tx => tx.amount < 0)
        .reduce((sum, tx) => sum + tx.amount, 0)

    return {
        balance,
        transactionCount: transactions.length,
        income,
        expenses
    }
}

/**
 * Get transactions for a specific date range
 */
async function getTransactionsForPeriod(startDate: Date, endDate: Date): Promise<Transaction[]> {
    return db.transaction.findMany({
        where: { valueDate: { gte: startDate, lte: endDate } }
    })
}

export default resolver.pipe(
    resolver.zod(GetDashboardKPIs),
    resolver.authorize(),
    async ({ startDate, endDate, previousPeriod }): Promise<DashboardKPIs> => {
        // Set default end date if not provided
        endDate ??= DateTime.now().toJSDate()

        // Calculate the previous period (same duration, immediately before the selected period)
        const periodDuration = DateTime.fromJSDate(endDate).diff(DateTime.fromJSDate(startDate))
        const previousStartDate = DateTime.fromJSDate(startDate).minus(periodDuration).toJSDate()
        const previousEndDate = startDate

        // Get current period transactions and calculate metrics
        const currentTransactions = await getTransactionsForPeriod(startDate, endDate)
        const currentMetrics = calculateFinancialMetrics(currentTransactions)

        // If previous period data is not needed, return current period data only
        if (!previousPeriod) {
            return {
                currentBalance: currentMetrics.balance,
                transactionCount: currentMetrics.transactionCount,
                totalIncome: currentMetrics.income,
                totalExpenses: currentMetrics.expenses
            }
        }

        // Get previous period transactions and calculate metrics
        const previousTransactions = await getTransactionsForPeriod(previousStartDate, previousEndDate)
        const previousMetrics = calculateFinancialMetrics(previousTransactions)

        return {
            currentBalance: currentMetrics.balance,
            previousBalance: previousMetrics.balance,
            transactionCount: currentMetrics.transactionCount,
            previousTransactionCount: previousMetrics.transactionCount,
            totalIncome: currentMetrics.income,
            previousIncome: previousMetrics.income,
            totalExpenses: currentMetrics.expenses,
            previousExpenses: previousMetrics.expenses
        }
    }
)
