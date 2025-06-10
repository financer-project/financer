import { resolver } from "@blitzjs/rpc"
import db from "src/lib/db"
import { z } from "zod"
import { DateTime } from "luxon"

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

export default resolver.pipe(
    resolver.zod(GetDashboardKPIs),
    resolver.authorize(),
    async ({ startDate, endDate, previousPeriod }): Promise<DashboardKPIs> => {
        endDate ??= DateTime.now().toJSDate()

        // Calculate the previous period (same duration, immediately before the selected period)
        const periodDuration = DateTime.fromJSDate(endDate).diff(DateTime.fromJSDate(startDate))
        const previousStartDate = DateTime.fromJSDate(startDate).minus(periodDuration).toJSDate()
        const previousEndDate = startDate

        // Get current period transactions
        const transactions = await db.transaction.findMany({
            where: { valueDate: { gte: startDate, lte: endDate } }
        })

        // Calculate current period metrics
        const currentBalance = transactions.reduce((sum, tx) => sum + tx.amount, 0)
        const transactionCount = transactions.length
        const totalIncome = transactions
            .filter(tx => tx.amount > 0)
            .reduce((sum, tx) => sum + tx.amount, 0)
        const totalExpenses = transactions
            .filter(tx => tx.amount < 0)
            .reduce((sum, tx) => sum + tx.amount, 0)

        // If previous period data is not needed, return current period data only
        if (!previousPeriod) {
            return {
                currentBalance,
                transactionCount,
                totalIncome,
                totalExpenses
            }
        }

        // Get previous period transactions
        const previousTransactions = await db.transaction.findMany({
            where: { valueDate: { gte: previousStartDate, lte: previousEndDate } }
        })

        // Calculate previous period metrics
        const previousBalance = previousTransactions.reduce((sum, tx) => sum + tx.amount, 0)
        const previousTransactionCount = previousTransactions.length
        const previousIncome = previousTransactions
            .filter(tx => tx.amount > 0)
            .reduce((sum, tx) => sum + tx.amount, 0)
        const previousExpenses = previousTransactions
            .filter(tx => tx.amount < 0)
            .reduce((sum, tx) => sum + tx.amount, 0)

        return {
            currentBalance,
            previousBalance,
            transactionCount,
            previousTransactionCount,
            totalIncome,
            previousIncome,
            totalExpenses,
            previousExpenses
        }
    }
)