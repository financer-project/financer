"use client"
import { usePaginatedQuery } from "@blitzjs/rpc"
import { useSearchParams } from "next/navigation"
import getTransactions from "@/src/lib/model/transactions/queries/getTransactions"
import { PaginatedTable } from "@/src/lib/components/common/data/PaginatedTable"
import withFormatters, { WithFormattersProps } from "@/src/lib/util/formatter/withFormatters"
import ColoredTag from "@/src/lib/components/content/categories/ColoredTag"
import { useCurrentHousehold } from "@/src/lib/components/provider/HouseholdProvider"

export const TransactionsList = withFormatters(({ formatters, itemsPerPage = 25 }: WithFormattersProps & {
    itemsPerPage?: number
}) => {
    const searchParams = useSearchParams()
    const currentHousehold = useCurrentHousehold()!
    const page = Number(searchParams?.get("page") ?? 0)
    const [{ transactions, hasMore }] = usePaginatedQuery(getTransactions, {
        skip: itemsPerPage * page,
        take: itemsPerPage,
        householdId: currentHousehold.id
    })

    return (
        <div>
            <PaginatedTable data={transactions}
                            columns={[
                                { name: "Name", render: transaction => transaction.name },
                                {
                                    name: "Category", render: transaction => transaction.category
                                        ? <ColoredTag color={transaction.category.color}
                                                      label={transaction.category.name} />
                                        : <span className={"text-muted-foreground"}>Uncategorized</span>
                                },
                                {
                                    name: "Tags", 
                                    render: transaction => transaction.tags && transaction.tags.length > 0
                                        ? (
                                            <div className="flex flex-wrap gap-1">
                                                {transaction.tags.map((tagRelation, index) => (
                                                    <ColoredTag 
                                                        key={index}
                                                        color={tagRelation.tag.color}
                                                        label={tagRelation.tag.name} 
                                                    />
                                                ))}
                                            </div>
                                        )
                                        : <span className={"text-muted-foreground"}>No tags</span>
                                },
                                {
                                    name: "Date",
                                    render: transaction => formatters.date.format(transaction.valueDate)
                                },
                                { name: "Amount", render: transaction => formatters.amount.format(transaction.amount) }
                            ]}
                            itemRoute={transaction => `/transactions/${transaction.id}`}
                            hasMore={hasMore} />
        </div>
    )
})
