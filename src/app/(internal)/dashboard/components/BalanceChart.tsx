"use client"

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/src/lib/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { useQuery } from "@blitzjs/rpc"
import getBalanceHistory from "@/src/lib/model/transactions/queries/getBalanceHistory"
import withFormatters, { WithFormattersProps } from "@/src/lib/util/formatter/withFormatters"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/lib/components/ui/card"
import { Suspense } from "react"
import { cn } from "@/src/lib/util/utils"
import { useTimeframe } from "../context/TimeframeContext"

const BalanceChart = ({ formatters, className }: WithFormattersProps & { className?: string }) => {
    const { timeframe } = useTimeframe()
    const [balance] = useQuery(getBalanceHistory, { startDate: timeframe.toJSDate() })

    return (
        <Card className={cn("w-full")}>
            <CardHeader>
                <CardTitle>Balance</CardTitle>
                <CardDescription>This is your overall balance.</CardDescription>
            </CardHeader>

            <CardContent>
                <Suspense fallback={<p>Loading ...</p>}>
                    <ChartContainer
                        className={cn("w-full", className)}
                        config={{
                            income: {
                                label: "Income",
                                color: "hsl(var(--chart-2))"
                            },
                            expense: {
                                label: "Expenses",
                                color: "hsl(var(--chart-1))"
                            }
                        }}>
                        <BarChart accessibilityLayer data={balance}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="month"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                tickFormatter={(value) => formatters.date.format(value, { onlyMonth: true })}
                            />
                            <ChartTooltip cursor={false}
                                          content={<ChartTooltipContent indicator="dot" />} />
                            <Bar dataKey="income"
                                 fill="var(--color-income)"
                                 radius={4} />
                            <Bar dataKey="expenses"
                                 fill="var(--color-expense)"
                                 radius={4} />
                        </BarChart>
                    </ChartContainer>
                </Suspense>
            </CardContent>
        </Card>
    )
}

export default withFormatters(BalanceChart)
