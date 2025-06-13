"use client"
import { useQuery } from "@blitzjs/rpc"
import { useTimeframe } from "../context/TimeframeContext"
import getTransactions from "@/src/lib/model/transactions/queries/getTransactions"
import { WithFormattersProps } from "@/src/lib/util/formatter/withFormatters"
import { useCurrentHousehold } from "@/src/lib/components/provider/HouseholdProvider"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/lib/components/ui/card"
import { Separator } from "@/src/lib/components/ui/separator"
import { Button } from "@/src/lib/components/ui/button"
import { ScrollArea, ScrollBar } from "@/src/lib/components/ui/scroll-area"
import { TransactionsList } from "@/src/app/(internal)/transactions/components/TransactionsList"
import { cn } from "@/lib/utils"
import { ArrowRight } from "lucide-react"

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
                gte: timeframe.toJSDate()
            }
        }
    })

    if (transactions.length === 0) {
        return (
            <div className={`rounded-lg border p-4 ${className || ""}`}>
                <h3 className="text-lg font-medium mb-2">Latest Transactions</h3>
                <p className="text-muted-foreground">No transactions found in the selected timeframe.</p>
            </div>
        )
    }

    return (
        <Card className={cn("flex flex-col gap-0", className)}>
            <CardHeader className={"flex flex-row justify-between items-center gap-4"}>
                <div className={"flex flex-col grow gap-2"}>
                    <CardTitle>Latest Transactions</CardTitle>
                    <CardDescription>
                        This is a list of the latest transactions within the selected timeframe.
                    </CardDescription>
                </div>
                <div>
                    <Button variant={"link"} asChild>
                        <Link href="/transactions">View all transactions <ArrowRight /></Link>
                    </Button>
                </div>
            </CardHeader>
            <Separator />

            <ScrollArea className={"flex-col max-h-full overflow-y-auto"}>
                <CardContent className={"flex flex-col max-h-full grow p-0"}>
                    <TransactionsList itemsPerPage={5} />
                    <ScrollBar orientation={"vertical"} className={"pl-2"} />
                </CardContent>
            </ScrollArea>

        </Card>
    )
}

export default LatestTransactions
