"use client"

import { usePaginatedQuery } from "@blitzjs/rpc"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import getHouseholds from "@/src/lib/model/household/queries/getHouseholds"
import { PaginatedTable } from "@/src/lib/components/common/data/PaginatedTable"
import { Formatters } from "@/src/lib/util/Formatter"

const ITEMS_PER_PAGE = 100

export const HouseholdsList = () => {
    const urlSearchParams = useSearchParams()!
    const page = Number(urlSearchParams.get("page")) || 0
    const [{ households, hasMore, count }] = usePaginatedQuery(getHouseholds, {
        orderBy: { id: "asc" },
        skip: ITEMS_PER_PAGE * page,
        take: ITEMS_PER_PAGE
    })

    return (
        <PaginatedTable
            data={households}
            hasMore={hasMore}
            itemRoute={(household) => `/households/${household.id}`}
            columns={[
                {
                    name: "Name",
                    render: (household) => <Link href={`/households/${household.id}`}>{household.name}</Link>
                },
                { name: "Currency", render: (household) => Formatters.currencyDescription.format(household.currency) },
                { name: "Description", render: (household) => household.description }
            ]}
            createRoute="/households/new"
        />
    )
}
