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
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/lib/components/ui/card"
import { Suspense, useState } from "react"
import { cn } from "@/src/lib/util/utils"
import { CategoryType } from "@prisma/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/lib/components/ui/tabs"
import { useTimeframe } from "../context/TimeframeContext"
import { Separator } from "@/src/lib/components/ui/separator"

const CategoryDistributionChart = ({ className }: { className?: string }) => {
    const { timeframe } = useTimeframe()
    const [activeTab, setActiveTab] = useState<string>("expenses") // Default to expenses tab
    const [categories] = useQuery(getCategoryDistribution, {
        startDate: timeframe.startDate.toJSDate(),
        endDate: timeframe.endDate?.toJSDate(),
        includeUncategorized: true
    })

    // Separate income and expense categories
    const incomeCategories = categories.filter(cat => cat.type === CategoryType.INCOME)
    const expenseCategories = categories.filter(cat => cat.type === CategoryType.EXPENSE)

    return (
        <Tabs defaultValue="expenses" value={activeTab} onValueChange={setActiveTab} className={cn("w-full", className)}>
            <Card className={"w-full"}>
                <CardHeader>
                    <CardTitle>Category Distribution</CardTitle>
                    <CardDescription>Breakdown by category.</CardDescription>
                    <CardAction>
                        <TabsList>
                            <TabsTrigger value="expenses">Expenses</TabsTrigger>
                            <TabsTrigger value="income">Income</TabsTrigger>
                        </TabsList>
                    </CardAction>
                </CardHeader>
                <Separator />
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
            </Card>
        </Tabs>
    )
}

const DistributionChart = withFormatters(({ categories }: {
    categories: CategoryDistribution[]
} & WithFormattersProps) => {
    const chartConfig: ChartConfig = {
        ...categories.reduce((config, category) => {
            config[category.id] = {
                label: category.name,
                color: `var(--color-${category.color}-500)`
            }
            return config
        }, {} as Record<string, unknown>)
    } as ChartConfig

    categories.forEach(category => category.amount = Math.abs(category.amount))

    const pieProps = {
        innerRadius: 50,
        outerRadius: "95",
        paddingAngle: 0
    }

    return (
        <ChartContainer
            className={cn("mx-auto aspect-square max-h-60 min-h-64 w-full")}
            config={chartConfig}>
            <PieChart>
                <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                <ChartLegend
                    visibility={categories.length >= 5 ? "hidden" : undefined}
                    content={<ChartLegendContent nameKey={"id"} />}
                    className="flex-wrap gap-2 *:basis-1/5 *:justify-center" />
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
