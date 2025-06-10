"use client"

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/src/lib/components/ui/chart"
import { Cell, Pie, PieChart } from "recharts"
import { useQuery } from "@blitzjs/rpc"
import getCategoryDistribution from "@/src/lib/model/transactions/queries/getCategoryDistribution"
import withFormatters, { WithFormattersProps } from "@/src/lib/util/formatter/withFormatters"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/lib/components/ui/card"
import { Suspense, useState } from "react"
import { cn } from "@/lib/utils"
import { CategoryType } from "@prisma/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/lib/components/ui/tabs"
import { useTimeframe } from "../context/TimeframeContext"

const CategoryDistributionChart = ({ formatters, className }: WithFormattersProps & { className?: string }) => {
    const { timeframe } = useTimeframe()
    const [activeTab, setActiveTab] = useState<string>("expenses") // Default to expenses tab
    const [categories] = useQuery(getCategoryDistribution, { startDate: timeframe.toJSDate() })

    // Separate income and expense categories
    const incomeCategories = categories.filter(cat => cat.type === CategoryType.INCOME)
    const expenseCategories = categories.filter(cat => cat.type === CategoryType.EXPENSE)

    return (
        <Card className={cn("w-full", className)}>
            <Tabs defaultValue="expenses" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <CardHeader>
                    <div className={"flex flex-row justify-between"}>
                        <div>
                            <CardTitle>Category Distribution</CardTitle>
                            <CardDescription>Breakdown by category.</CardDescription>
                        </div>
                        <div>
                            <TabsList className="mb-4">
                                <TabsTrigger value="expenses">Expenses</TabsTrigger>
                                <TabsTrigger value="income">Income</TabsTrigger>
                            </TabsList>
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    <Suspense fallback={<p>Loading ...</p>}>
                        {/* Expenses Tab Content */}
                        <TabsContent value="expenses" className="flex justify-center">
                            <ChartContainer
                                className={cn("h-64 w-64", className)}
                                config={{
                                    expense: {
                                        label: "Expenses",
                                        color: "hsl(var(--chart-1))"
                                    }
                                }}>
                                <PieChart>
                                    <Pie
                                        data={expenseCategories}
                                        dataKey="amount"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={2}
                                        label={({ name, percent }) =>
                                            `${name}: ${(percent * 100).toFixed(0)}%`
                                        }
                                        labelLine={false}
                                    >
                                        {expenseCategories.map((entry, index) => (
                                            <Cell
                                                key={`cell-expense-${index}`}
                                                color={entry.color || `hsl(${(index * 30) + 120}, 70%, 50%)`}
                                            />
                                        ))}
                                    </Pie>
                                    <ChartTooltip
                                        formatter={(value) => formatters.amount.format(value as number)}
                                        content={<ChartTooltipContent indicator="dot" />}
                                    />
                                </PieChart>
                            </ChartContainer>
                        </TabsContent>

                        {/* Income Tab Content */}
                        <TabsContent value="income" className="flex justify-center">
                            <ChartContainer
                                className={cn("h-64 w-64", className)}
                                config={{
                                    income: {
                                        label: "Income",
                                        color: "hsl(var(--chart-2))"
                                    }
                                }}>
                                <PieChart>
                                    <Pie
                                        data={incomeCategories}
                                        dataKey="amount"
                                        nameKey="name"
                                        cx="80%"
                                        cy="80%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={2}
                                        label={({ name, percent }) =>
                                            `${name}: ${(percent * 100).toFixed(0)}%`
                                        }
                                        labelLine={false}>
                                        {incomeCategories.map((entry, index) => (
                                            <Cell
                                                key={`cell-income-${index}`}
                                                fill={entry.color || `hsl(${(index * 30) + 120}, 70%, 50%)`}
                                            />
                                        ))}
                                    </Pie>
                                    <ChartTooltip
                                        formatter={(value) => formatters.amount.format(value as number)}
                                        content={<ChartTooltipContent indicator="dot" />}
                                    />
                                </PieChart>
                            </ChartContainer>
                        </TabsContent>
                    </Suspense>
                </CardContent>
            </Tabs>
        </Card>
    )
}

export default withFormatters(CategoryDistributionChart)
