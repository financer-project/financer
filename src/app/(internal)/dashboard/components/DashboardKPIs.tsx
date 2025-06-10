"use client"

import React from "react"
import { useQuery } from "@blitzjs/rpc"
import { useTimeframe } from "../context/TimeframeContext"
import getDashboardKPIs from "@/src/lib/model/dashboard/queries/getDashboardKPIs"
import KPICard, { TrendDirection } from "./KPICard"
import withFormatters, { WithFormattersProps } from "@/src/lib/util/formatter/withFormatters"
import { BarChart3Icon, CreditCardIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react"

// Helper function to calculate percentage change
const calculatePercentChange = (current: number, previous: number | undefined): {
    value: number,
    direction: TrendDirection
} => {
    if (!previous || previous === 0) {
        return { value: 0, direction: "neutral" }
    }

    const change = ((current - previous) / Math.abs(previous)) * 100
    const direction: TrendDirection = change > 0 ? "up" : change < 0 ? "down" : "neutral"

    return { value: Math.abs(Math.round(change)), direction }
}

const DashboardKPIs: React.FC<WithFormattersProps> = ({ formatters }) => {
    const { timeframe } = useTimeframe()
    const [kpis] = useQuery(getDashboardKPIs, {
        startDate: timeframe.toJSDate(),
        previousPeriod: true
    })

    // Calculate trends
    const balanceTrend = calculatePercentChange(kpis.currentBalance, kpis.previousBalance)
    const transactionCountTrend = calculatePercentChange(kpis.transactionCount, kpis.previousTransactionCount)
    const incomeTrend = calculatePercentChange(kpis.totalIncome, kpis.previousIncome)
    const expensesTrend = calculatePercentChange(Math.abs(kpis.totalExpenses), kpis.previousExpenses ? Math.abs(kpis.previousExpenses) : undefined)

    // For expenses, we want "down" to be positive (green) and "up" to be negative (red)
    const adjustedExpensesTrend = {
        ...expensesTrend,
        direction: expensesTrend.direction === "up" ? "down" : expensesTrend.direction === "down" ? "up" : "neutral"
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KPICard
                title="Current Balance"
                value={formatters.amount.format(kpis.currentBalance)}
                description="Total balance across all accounts"
                trend={{
                    ...balanceTrend,
                    label: "vs previous period"
                }}
                icon={<CreditCardIcon className="w-4 h-4" />}
            />

            <KPICard
                title="Transaction Count"
                value={kpis.transactionCount}
                description="Number of transactions in period"
                trend={{
                    ...transactionCountTrend,
                    label: "vs previous period"
                }}
                icon={<BarChart3Icon className="w-4 h-4" />}
            />

            <KPICard
                title="Total Income"
                value={formatters.amount.format(kpis.totalIncome)}
                description="Income in selected period"
                trend={{
                    ...incomeTrend,
                    label: "vs previous period"
                }}
                icon={<TrendingUpIcon className="w-4 h-4" />}
            />

            <KPICard
                title="Total Expenses"
                value={formatters.amount.format(Math.abs(kpis.totalExpenses))}
                description="Expenses in selected period"
                trend={{
                    ...adjustedExpensesTrend,
                    label: "vs previous period"
                }}
                icon={<TrendingDownIcon className="w-4 h-4" />}
            />
        </div>
    )
}

export default withFormatters(DashboardKPIs)