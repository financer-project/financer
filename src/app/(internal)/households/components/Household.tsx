"use client"
import { usePaginatedQuery, useQuery } from "@blitzjs/rpc"
import getHousehold from "@/src/lib/model/household/queries/getHousehold"
import DataItem from "@/src/lib/components/common/data/DataItem"
import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { PaginatedTable } from "@/src/lib/components/common/data/PaginatedTable"
import getAccounts from "@/src/lib/model/account/queries/getAccounts"
import Section from "@/src/lib/components/common/structure/Section"
import withFormatters, { WithFormattersProps } from "@/src/lib/util/formatter/withFormatters"

const ITEMS_PER_PAGE = 100

export const Household = withFormatters(({ formatters, householdId }: WithFormattersProps & {
    householdId: string
}) => {
    const [household] = useQuery(getHousehold, { id: householdId })

    const urlSearchParams = useSearchParams()
    const page = Number(urlSearchParams?.get("page") ?? 0)
    const [{ accounts, hasMore }] = usePaginatedQuery(getAccounts, {
        householdId: householdId,
        orderBy: { id: "asc" },
        skip: ITEMS_PER_PAGE * page,
        take: ITEMS_PER_PAGE
    })

    return (
        <div className={"flex flex-col gap-16"}>
            <Section title={"Basic Information"}
                     subtitle={"Please find all information to the household below."}>
                <div className={"flex flex-row w-full"}>
                    <DataItem label={"Name"}
                              data={household.name}
                              className={"basis-1/4"} />

                    <DataItem label={"Currency"}
                              data={formatters.currencyDescription.format(household.currency)}
                              className={"basis-1/4"} />

                    <DataItem label={"Description"}
                              data={household.description}
                              className={"basis-1/4"} />
                </div>
            </Section>


            <Section title={"Accounts"}
                     subtitle={"Please find all information to the household below."}>
                <Suspense fallback={<div>Loading...</div>}>
                    <PaginatedTable
                        data={accounts}
                        hasMore={hasMore}
                        itemRoute={(account) => `/households/${account.householdId}/accounts/${account.id}`}
                        createRoute={`/households/${household.id}/accounts/new`}
                        columns={[
                            {
                                name: "Name",
                                render: (account) =>
                                    <span className={"font-semibold"}>{account.name}</span>
                            },
                            {
                                name: "Technical Name",
                                render: (account) => account.technicalName
                            }
                        ]}
                    />
                </Suspense>
            </Section>
        </div>
    )
})