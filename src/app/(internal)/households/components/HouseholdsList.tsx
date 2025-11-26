"use client"

import { usePaginatedQuery } from "@blitzjs/rpc"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import getHouseholds from "@/src/lib/model/household/queries/getHouseholds"
import { DataTable } from "@/src/lib/components/common/data/table"
import withFormatters, { WithFormattersProps } from "@/src/lib/util/formatter/withFormatters"
import { useCurrentHousehold } from "@/src/lib/components/provider/HouseholdProvider"
import { Household } from "@prisma/client"
import { useState } from "react"
import { Badge } from "@/src/lib/components/ui/badge"

const ITEMS_PER_PAGE = 100

export const HouseholdsList = withFormatters(({ formatters }: WithFormattersProps) => {
    const [currentHousehold] = useState<Household | undefined>(useCurrentHousehold())

    const urlSearchParams = useSearchParams()
    const page = Number(urlSearchParams?.get("page") ?? 0)
    const [{ households, hasMore }] = usePaginatedQuery(getHouseholds, {
        orderBy: { id: "asc" },
        skip: ITEMS_PER_PAGE * page,
        take: ITEMS_PER_PAGE
    })

    return (
        <DataTable
            data={households}
            hasMore={hasMore}
            itemRoute={(household) => `/households/${household.id}`}
            columns={[
                {
                    name: "Name",
                    render: (household) => <Link href={`/households/${household.id}`}>{household.name}</Link>,
                    isKey: true
                },
                {
                    name: "Status", render: (household) =>
                        currentHousehold?.id === household.id
                            ? <Badge variant={"default"}>Active</Badge>
                            : <Badge variant={"outline"}>Inactive</Badge>
                },
                { name: "Currency", render: (household) => formatters.currencyDescription.format(household.currency) },
                { name: "Description", render: (household) => household.description }
            ]}
            createRoute="/households/new"
        />
    )
})
