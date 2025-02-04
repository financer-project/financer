"use client"

import { usePaginatedQuery } from "@blitzjs/rpc"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import getHouseholds from "@/src/lib/model/household/queries/getHouseholds"
import { PaginatedTable } from "@/src/lib/components/common/data/PaginatedTable"
import { Formatters } from "@/src/lib/util/Formatter"
import { useCurrentHousehold } from "@/src/lib/components/provider/HouseholdProvider"
import { Household } from "@prisma/client"
import { useState } from "react"
import { Badge } from "@/src/lib/components/ui/badge"

const ITEMS_PER_PAGE = 100

export const HouseholdsList = () => {
    const [currentHousehold] = useState<Household | null>(useCurrentHousehold())

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
                {
                    name: "Status", render: (household) =>
                        currentHousehold?.id === household.id
                            ? <Badge variant={"default"}>Active</Badge>
                            : <Badge variant={"outline"}>Inactive</Badge>
                },
                { name: "Currency", render: (household) => Formatters.currencyDescription.format(household.currency) },
                { name: "Description", render: (household) => household.description }
            ]}
            createRoute="/households/new"
        />
    )
}
