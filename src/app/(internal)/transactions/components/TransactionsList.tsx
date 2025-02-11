"use client"
import { usePaginatedQuery } from "@blitzjs/rpc"
import { useSearchParams } from "next/navigation"
import getTransactions from "@/src/lib/model/transactions/queries/getTransactions"
import { PaginatedTable } from "@/src/lib/components/common/data/PaginatedTable"
import withFormatters, { WithFormattersProps } from "@/src/lib/util/formatter/withFormatters"

const ITEMS_PER_PAGE = 100

export const TransactionsList = withFormatters(({ formatters }: WithFormattersProps) => {
    const searchParams = useSearchParams()
    const page = Number(searchParams.get("page")) || 0
    const [{ transactions, hasMore }] = usePaginatedQuery(getTransactions, {
        orderBy: { id: "asc" },
        skip: ITEMS_PER_PAGE * page,
        take: ITEMS_PER_PAGE
    })

    return (
        <div>
            <PaginatedTable data={transactions}
                            columns={[
                                { name: "Name", render: transaction => transaction.name },
                                { name: "Category", render: transaction => transaction.category?.name ?? "Uncategorized"},
                                { name: "Amount", render: transaction => formatters.amount.format(transaction.amount) }
                            ]}
                            itemRoute={transaction => `/transactions/${transaction.id}`}
                            hasMore={hasMore} />
        </div>
    )
})