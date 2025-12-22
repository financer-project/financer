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
import { Separator } from "@/src/lib/components/ui/separator"

const BalanceChart = ({ formatters, className }: WithFormattersProps & { className?: string }) => {
    const { timeframe } = useTimeframe()
    const [balance] = useQuery(getBalanceHistory, {
        startDate: timeframe.startDate.toJSDate(),
        endDate: timeframe.endDate?.toJSDate()
    })

    return (
        <Card className={cn("w-full", className)}>
            <CardHeader>
                <CardTitle>Balance</CardTitle>
                <CardDescription>This is your overall balance.</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent>
                <Suspense fallback={<p>Loading ...</p>}>
                    <ChartContainer
                        className={cn("w-full max-h-72")}
                        config={{
                            income: {
                                label: "Income",
                                color: "hsl(var(--chart-2))"
                            },
                            expenses: {
                                label: "Expenses",
                                color: "hsl(var(--chart-1))"
                            }
                        }}>
                        <BarChart accessibilityLayer data={balance} dataKey={"month"}>
                            <CartesianGrid vertical={false} />
                            <ChartTooltip cursor={false}
                                          content={<ChartTooltipContent indicator="dot"/>} />
                            <XAxis
                                dataKey="month"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                tickFormatter={(value) => formatters.date.format(value, { onlyMonth: true })}
                            />
                            <Bar dataKey="income"
                                 fill="var(--color-chart-2)"
                                 radius={4} />
                            <Bar dataKey="expenses"
                                 fill="var(--color-chart-1)"
                                 radius={4} />
                        </BarChart>
                    </ChartContainer>
                </Suspense>
            </CardContent>
        </Card>
    )
}

export default withFormatters(BalanceChart)
