"use client"
import { useQuery } from "@blitzjs/rpc"
import { useTimeframe } from "../context/TimeframeContext"
import getTransactions from "@/src/lib/model/transactions/queries/getTransactions"
import { useCurrentHousehold } from "@/src/lib/components/provider/HouseholdProvider"
import Link from "next/link"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/lib/components/ui/card"
import { Separator } from "@/src/lib/components/ui/separator"
import { Button } from "@/src/lib/components/ui/button"
import { ScrollArea, ScrollBar } from "@/src/lib/components/ui/scroll-area"
import { TransactionsList } from "@/src/app/(internal)/transactions/components/TransactionsList"
import { cn } from "@/src/lib/util/utils"
import { ArrowRight } from "lucide-react"
import { CategoryProvider } from "@/src/lib/components/provider/CategoryProvider"
import { TagProvider } from "@/src/lib/components/provider/TagProvider"
import { CounterpartyProvider } from "@/src/lib/components/provider/CounterpartyProvider"
import { AccountProvider } from "@/src/lib/components/provider/AccountProvider"

interface LatestTransactionsProps {
    className?: string;
}

const LatestTransactions: React.FC<LatestTransactionsProps> = ({ className }) => {
    const { timeframe } = useTimeframe()
    const currentHousehold = useCurrentHousehold()!

    // Fetch only the latest 5 transactions within the selected timeframe
    const [{ transactions }] = useQuery(getTransactions, {
        skip: 0,
        take: 5,
        householdId: currentHousehold.id,
        where: {
            valueDate: {
                gte: timeframe.startDate.toJSDate(),
                lte: timeframe.endDate?.toJSDate()
            }
        }
    })

    if (transactions.length === 0) {
        return (
            <div className={`rounded-lg border p-4 ${className ?? ""}`}>
                <h3 className="text-lg font-medium mb-2">Latest Transactions</h3>
                <p className="text-muted-foreground">No transactions found in the selected timeframe.</p>
            </div>
        )
    }

    // Let TransactionsList manage its own page size via URL (default 25).

    return (
        <Card className={cn(className)}>
            <CardHeader>
                <CardTitle>Latest Transactions</CardTitle>
                <CardDescription>
                    This is a list of the latest transactions within the selected timeframe.
                </CardDescription>
                <CardAction>
                    <Button variant={"link"} asChild>
                        <Link href="/transactions">View all transactions <ArrowRight /></Link>
                    </Button>
                </CardAction>
            </CardHeader>
            <Separator />

            <ScrollArea className={"flex-col max-h-full overflow-y-auto"}>
                <CardContent className={"flex flex-col max-h-full grow "}>
                    <AccountProvider>
                        <CategoryProvider>
                            <TagProvider>
                                <CounterpartyProvider>
                                    <TransactionsList hideFilters={true} />
                                </CounterpartyProvider>
                            </TagProvider>
                        </CategoryProvider>
                    </AccountProvider>
                    <ScrollBar orientation={"vertical"} className={"pl-2"} />
                </CardContent>
            </ScrollArea>

        </Card>
    )
}

export default LatestTransactions
