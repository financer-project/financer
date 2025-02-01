"use client"
import { usePaginatedQuery } from "@blitzjs/rpc"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import getAccounts from "@/src/lib/model/account/queries/getAccounts"
import { PaginatedTable } from "@/src/lib/components/common/data/PaginatedTable"

const ITEMS_PER_PAGE = 100

export const AccountsList = () => {
    const urlSearchParams = useSearchParams()!
    const page = Number(urlSearchParams.get("page")) || 0
    const [{ accounts, hasMore }] = usePaginatedQuery(getAccounts, {
        orderBy: { id: "asc" },
        skip: ITEMS_PER_PAGE * page,
        take: ITEMS_PER_PAGE
    })

    return (
        <PaginatedTable
            data={accounts}
            hasMore={hasMore}
            itemRoute={(account) => `/accounts/${account.id}`}
            createRoute={"/accounts/new"}
            columns={[
                { name: "Account Name", render: (account) => account.name },
                { name: "Actions", render: (account) => <Link href={`/accounts/${account.id}`}>View</Link> }
            ]} />
    )

}
