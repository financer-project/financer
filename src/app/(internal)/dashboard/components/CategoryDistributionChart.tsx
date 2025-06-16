"use client"

import {
    ChartConfig,
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent
} from "@/src/lib/components/ui/chart"
import { Cell, Pie, PieChart } from "recharts"
import { useQuery } from "@blitzjs/rpc"
import getCategoryDistribution, {
    CategoryDistribution
} from "@/src/lib/model/transactions/queries/getCategoryDistribution"
import withFormatters, { WithFormattersProps } from "@/src/lib/util/formatter/withFormatters"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/lib/components/ui/card"
import { Suspense, useState } from "react"
import { cn } from "@/src/lib/util/utils"
import { CategoryType } from "@prisma/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/lib/components/ui/tabs"
import { useTimeframe } from "../context/TimeframeContext"

const CategoryDistributionChart = ({ className }: { className?: string }) => {
    const { timeframe } = useTimeframe()
    const [activeTab, setActiveTab] = useState<string>("expenses") // Default to expenses tab
    const [categories] = useQuery(getCategoryDistribution, {
        startDate: timeframe.toJSDate(),
        includeUncategorized: true
    })

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
                        <TabsContent value="expenses" className="flex justify-center">
                            <DistributionChart categories={expenseCategories} />
                        </TabsContent>

                        <TabsContent value="income" className="flex justify-center">
                            <DistributionChart categories={incomeCategories} />
                        </TabsContent>
                    </Suspense>
                </CardContent>
            </Tabs>
        </Card>
    )
}

const DistributionChart = withFormatters(({ categories, formatters }: {
    categories: CategoryDistribution[]
} & WithFormattersProps) => {
    const chartConfig: ChartConfig = {
        ...categories.reduce((config, category) => {
            config[category.id] = {
                label: category.name,
                color: `var(--color-${category.color}-500)`
            }
            return config
        }, {} as Record<string, unknown>),
        amount: {
            label: "Amount"
        }
    }

    categories.forEach(category => category.amount = Math.abs(category.amount))

    const pieProps = {
        innerRadius: 60,
        outerRadius: "95",
        paddingAngle: 4
    }

    return (
        <ChartContainer
            className={cn("mx-auto aspect-square max-h-[250px] min-h-64")}
            config={chartConfig}>
            <PieChart>
                <ChartTooltip
                    formatter={(value) => formatters.amount.format(value as number)}
                    content={<ChartTooltipContent nameKey={"id"} />} />
                <ChartLegend
                    content={<ChartLegendContent nameKey={"id"} />}
                    className="-translate-y-2 flex-wrap gap-2 *:basis-1/4 *:justify-center" />
                <Pie
                    {...pieProps}
                    data={categories}
                    dataKey={"amount"}
                    nameKey={"id"}>
                    {categories.map(category => (
                        <Cell
                            key={category.id}
                            fill={`var(--color-${category.id})`} />
                    ))}
                </Pie>
            </PieChart>
        </ChartContainer>
    )
})

export default CategoryDistributionChart
