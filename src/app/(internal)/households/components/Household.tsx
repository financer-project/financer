"use client"
import { usePaginatedQuery, useQuery } from "@blitzjs/rpc"
import getHousehold from "@/src/lib/model/household/queries/getHousehold"
import { Heading1, SubHeading } from "@/src/lib/components/common/typography"
import DataItem from "@/src/lib/components/common/data/DataItem"
import { Formatters } from "@/src/lib/util/Formatter"
import { Separator } from "@/src/lib/components/ui/separator"
import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { PaginatedTable } from "@/src/lib/components/common/data/PaginatedTable"
import Link from "next/link"
import getAccounts from "@/src/lib/model/account/queries/getAccounts"

const ITEMS_PER_PAGE = 100

export const Household = ({ householdId }: { householdId: string }) => {
    const [household] = useQuery(getHousehold, { id: householdId })

    const urlSearchParams = useSearchParams()!
    const page = Number(urlSearchParams.get("page")) || 0
    const [{ accounts, hasMore }] = usePaginatedQuery(getAccounts, {
        orderBy: { id: "asc" },
        skip: ITEMS_PER_PAGE * page,
        take: ITEMS_PER_PAGE
    })

    return (
        <div className={"flex flex-col gap-12"}>
            <section>
                <Heading1>Basic Information</Heading1>
                <SubHeading>Please find all information to the household below.</SubHeading>

                <Separator className={"my-4"} />

                <div className={"flex flex-row w-full"}>
                    <DataItem label={"Name"}
                              data={household.name}
                              className={"basis-1/4"} />

                    <DataItem label={"Currency"}
                              data={Formatters.currencyDescription.format(household.currency)}
                              className={"basis-1/4"} />

                    <DataItem label={"Description"}
                              data={household.description}
                              className={"basis-1/4"} />
                </div>
            </section>

            <section>
                <Heading1>Accounts</Heading1>
                <SubHeading>Please find all information to the household below.</SubHeading>

                <Separator className={"my-4"} />

                <Suspense fallback={<div>Loading...</div>}>
                    <PaginatedTable
                        data={accounts}
                        hasMore={hasMore}
                        itemRoute={(household) => `/households/${household.id}`}
                        createRoute={`/households/${household.id}/accounts/new`}
                        columns={[
                            {
                                name: "Name",
                                render: (household) =>
                                    <Link href={`/households/${household.id}`}>{household.name}</Link>
                            }
                        ]}
                    />
                </Suspense>
            </section>
        </div>
    )
}
