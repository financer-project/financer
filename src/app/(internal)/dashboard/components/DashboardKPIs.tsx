"use client"

import React from "react"
import { useQuery } from "@blitzjs/rpc"
import { useTimeframe } from "../context/TimeframeContext"
import getDashboardKPIs from "@/src/lib/model/dashboard/queries/getDashboardKPIs"
import KPICard, { TrendDirection } from "./KPICard"
import withFormatters, { WithFormattersProps } from "@/src/lib/util/formatter/withFormatters"
import { BarChart3Icon, CreditCardIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react"

/**
 * Calculate percentage change between current and previous values
 *
 * @param current - Current value
 * @param previous - Previous value to compare against
 * @param invertDirection - Whether to invert the direction (useful for expenses where down is good)
 * @returns Object containing the percentage change value and direction
 */
const calculatePercentChange = (
    current: number,
    previous: number | undefined,
    invertDirection: boolean = false
): {
    value: number,
    direction: TrendDirection
} => {
    // Handle cases where previous is undefined or zero
    if (!previous || previous === 0) {
        return { value: 0, direction: "neutral" }
    }

    // Calculate percentage change
    const change = ((current - previous) / Math.abs(previous)) * 100

    // Determine direction based on whether change is positive, negative, or zero
    let direction: TrendDirection
    if (change > 0) {
        direction = "up"
    } else {
        direction = change < 0 ? "down" : "neutral"
    }

    // Invert direction if requested (e.g., for expenses where down is good)
    if (invertDirection) {
        if (direction === "up") {
            direction = "down"
        } else {
            direction = direction === "down" ? "up" : "neutral"
        }
    }

    // Return absolute value of change and direction
    return {
        value: Math.abs(Math.round(change)),
        direction
    }
}

const DashboardKPIs: React.FC<WithFormattersProps> = ({ formatters }) => {
    const { timeframe } = useTimeframe()
    const [kpis] = useQuery(getDashboardKPIs, {
        startDate: timeframe.toJSDate(),
        previousPeriod: true
    })

    // Calculate trends
    // For balance and income, an increase is positive (up = green)
    const balanceTrend = calculatePercentChange(kpis.currentBalance, kpis.previousBalance)
    const transactionCountTrend = calculatePercentChange(kpis.transactionCount, kpis.previousTransactionCount)
    const incomeTrend = calculatePercentChange(kpis.totalIncome, kpis.previousIncome)

    // For expenses, a decrease is positive (down = green), so we invert the direction
    // We use absolute values because expenses are stored as negative numbers
    const expensesTrend = calculatePercentChange(
        Math.abs(kpis.totalExpenses),
        kpis.previousExpenses ? Math.abs(kpis.previousExpenses) : undefined,
        true // Invert direction because lower expenses are better
    )

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
                icon={<CreditCardIcon className="w-4 h-4" />} />

            <KPICard
                title="Transaction Count"
                value={kpis.transactionCount}
                description="Number of transactions in period"
                trend={{
                    ...transactionCountTrend,
                    label: "vs previous period"
                }}
                icon={<BarChart3Icon className="w-4 h-4" />} />

            <KPICard
                title="Total Income"
                value={formatters.amount.format(kpis.totalIncome)}
                description="Income in selected period"
                trend={{
                    ...incomeTrend,
                    label: "vs previous period"
                }}
                icon={<TrendingUpIcon className="w-4 h-4" />} />

            <KPICard
                title="Total Expenses"
                value={formatters.amount.format(Math.abs(kpis.totalExpenses))}
                description="Expenses in selected period"
                trend={{
                    ...expensesTrend,
                    label: "vs previous period"
                }}
                icon={<TrendingDownIcon className="w-4 h-4" />} />
        </div>
    )
}

export default withFormatters(DashboardKPIs)
