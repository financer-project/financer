import { resolver } from "@blitzjs/rpc"
import db from "src/lib/db"
import { z } from "zod"
import { DateTime } from "luxon"

const GetBalanceHistory = z.object({
    startDate: z.date().max(DateTime.now().endOf("month").toJSDate()),
    endDate: z.date().max(DateTime.now().endOf("month").toJSDate()).optional()
})


export interface BalanceHistory {
    month: Date,
    expenses: number
    income: number
}

export default resolver.pipe(
    resolver.zod(GetBalanceHistory),
    resolver.authorize(),
    async ({ startDate, endDate }): Promise<BalanceHistory[]> => {
        endDate ??= DateTime.now().toJSDate()

        const transactions = await db.transaction.findMany({
            where: { valueDate: { gte: startDate, lte: endDate } },
            orderBy: { valueDate: "asc" }
        })

        const expenseAndIncomeHistory: BalanceHistory[] = []

        const start = DateTime.fromJSDate(startDate).startOf("month")
        const end = DateTime.fromJSDate(endDate).startOf("month").plus({ months: 1 })

        let current = start
        while (current < end) {
            const monthDate = current.toJSDate()
            const { income, expenses } = transactions.reduce(
                (totals, transaction) => {
                    const transactionMonth = DateTime.fromJSDate(transaction.valueDate).startOf("month")
                    if (transactionMonth.equals(current)) {
                        if (transaction.amount >= 0) {
                            totals.income += transaction.amount
                        } else {
                            totals.expenses += transaction.amount
                        }
                    }
                    return totals
                },
                { income: 0, expenses: 0 }
            )

            expenseAndIncomeHistory.push({ month: monthDate, income, expenses })
            current = current.plus({ months: 1 })
        }

        return expenseAndIncomeHistory

    }
)