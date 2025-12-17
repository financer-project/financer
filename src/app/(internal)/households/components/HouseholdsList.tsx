"use client"

import { usePaginatedQuery } from "@blitzjs/rpc"
import Link from "next/link"
import getHouseholds from "@/src/lib/model/household/queries/getHouseholds"
import { DataTable, useDataTable } from "@/src/lib/components/common/data/table"
import withFormatters, { WithFormattersProps } from "@/src/lib/util/formatter/withFormatters"
import { useCurrentHousehold } from "@/src/lib/components/provider/HouseholdProvider"
import { Household, HouseholdRole } from "@prisma/client"
import { useState } from "react"
import { Badge } from "@/src/lib/components/ui/badge"

export const HouseholdsList = withFormatters(({ formatters }: WithFormattersProps) => {
    const [currentHousehold] = useState<Household | undefined>(useCurrentHousehold())

    const { page, pageSize } = useDataTable({ defaultPageSize: 25 })
    const [{ households, count }] = usePaginatedQuery(getHouseholds, {
        orderBy: { id: "asc" },
        skip: pageSize * page,
        take: pageSize
    })

    return (
        <DataTable
            data={households}
            count={count}
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
                {
                    name: "Role", render: (household) => {
                        // Check user's role in the household
                        const membership = household.members?.[0]
                        if (membership) {
                            if (membership.role === HouseholdRole.OWNER) {
                                return <Badge variant={"default"}>Owner</Badge>
                            } else if (membership.role === HouseholdRole.ADMIN) {
                                return <Badge variant={"default"}>Admin</Badge>
                            } else if (membership.role === HouseholdRole.MEMBER) {
                                return <Badge variant={"secondary"}>Member</Badge>
                            } else {
                                return <Badge variant={"outline"}>Guest</Badge>
                            }
                        }

                        return null
                    }
                },
                { name: "Currency", render: (household) => formatters.currencyDescription.format(household.currency) },
                { name: "Description", render: (household) => household.description }
            ]}
            createRoute="/households/new"
        />
    )
})
