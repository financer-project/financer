"use client"

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/src/lib/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { useQuery } from "@blitzjs/rpc"
import getBalanceHistory from "@/src/lib/model/transactions/queries/getBalanceHistory"
import withFormatters, { WithFormattersProps } from "@/src/lib/util/formatter/withFormatters"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/lib/components/ui/card"
import { Suspense, useState } from "react"
import { SelectField, SelectOption } from "@/src/lib/components/common/form/elements/SelectField"
import { DateTime } from "luxon"
import { cn } from "@/lib/utils"

// Initialize currentDate globally so it's stable across renders
const currentDate = DateTime.now()

const selectOptions: SelectOption<DateTime>[] = [
    { label: "Last 3 Months", value: currentDate.minus({ months: 3 }) },
    { label: "Last Year", value: currentDate.minus({ months: 12 }) }
]

const BalanceChart = ({ formatters, className }: WithFormattersProps & { className?: string }) => {
    const [startDate, setStartDate] = useState<DateTime>(selectOptions[0].value)
    const [balance] = useQuery(getBalanceHistory, { startDate: startDate.toJSDate() })

    return (
        <Card className={cn("w-full")}>
            <CardHeader>
                <div className={"flex flex-row justify-between"}>
                    <div>
                        <CardTitle>Balance</CardTitle>
                        <CardDescription>This is your overall balance.</CardDescription>
                    </div>
                    <div>
                        <SelectField<DateTime>
                            className={"min-w-64"}
                            placeholder={"Timeframe"}
                            value={startDate}
                            onChange={value => value && setStartDate(value)}
                            options={selectOptions} />
                    </div>
                </div>

            </CardHeader>

            <CardContent>
                <Suspense fallback={<p>Loading ...</p>}>
                    <ChartContainer
                        className={cn(" w-full", className)}
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