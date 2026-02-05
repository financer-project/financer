"use client"

import { useMutation, usePaginatedQuery, useQuery } from "@blitzjs/rpc"
import getHousehold from "@/src/lib/model/household/queries/getHousehold"
import getCurrentMembership from "@/src/lib/model/household/queries/getCurrentMembership"
import setDefaultAccount from "@/src/lib/model/household/mutations/setDefaultAccount"
import DataItem from "@/src/lib/components/common/data/DataItem"
import { DataItemContainer } from "@/src/lib/components/common/data/DataItemContainer"
import { Suspense } from "react"
import { DataTable, useDataTable } from "@/src/lib/components/common/data/table"
import getAccounts from "@/src/lib/model/account/queries/getAccounts"
import Section from "@/src/lib/components/common/structure/Section"
import withFormatters, { WithFormattersProps } from "@/src/lib/util/formatter/withFormatters"
import HouseholdMemberList from "@/src/app/(internal)/households/components/HouseholdMemberList"
import { Star } from "lucide-react"
import { cn } from "@/src/lib/util/utils"
import { Button } from "@/src/lib/components/ui/button"

export const Household = withFormatters(({ formatters, householdId }: WithFormattersProps & {
    householdId: string
}) => {
    const [household] = useQuery(getHousehold, { id: householdId })
    const [membership, { refetch: refetchMembership }] = useQuery(getCurrentMembership, { householdId })
    const [setDefaultAccountMutation] = useMutation(setDefaultAccount)

    const { page, pageSize } = useDataTable({ defaultPageSize: 25 })
    const [{ accounts, count }] = usePaginatedQuery(getAccounts, {
        householdId: householdId,
        orderBy: { id: "asc" },
        skip: pageSize * page,
        take: pageSize
    })

    return (
        <div className={"flex flex-col gap-16"}>
            <Section title={"Basic Information"}
                     subtitle={"Please find all information to the household below."}>
                <DataItemContainer>
                    <DataItem label={"Name"}
                              data={household.name} />

                    <DataItem label={"Currency"}
                              data={formatters.currencyDescription.format(household.currency)} />

                    <DataItem label={"Description"}
                              data={household.description} />
                </DataItemContainer>
            </Section>

            <Section title={"Accounts"}
                     subtitle={"Please find all information to the household below."}>
                <Suspense fallback={<div>Loading...</div>}>
                    <DataTable
                        data={accounts}
                        count={count}
                        itemRoute={(account) => `/households/${account.householdId}/accounts/${account.id}`}
                        createRoute={`/households/${household.id}/accounts/new`}
                        columns={[
                            {
                                name: "Name",
                                render: (account) =>
                                    <span className={"font-semibold flex items-center gap-2"}>
                                        <Star
                                            className={cn("h-4 w-4", membership?.defaultAccountId === account.id ? "" : "invisible")} />
                                        {account.name}
                                    </span>,
                                isKey: true
                            },
                            {
                                name: "Technical Name",
                                render: (account) => account.technicalIdentifier
                            },
                            {
                                name: "",
                                render: (account) => {
                                    const isDefault = membership?.defaultAccountId === account.id
                                    return (
                                        <div className={"flex gap-2 justify-end"}>
                                            <Button variant={"ghost"} size={"sm"}
                                                    onClick={async (e) => {
                                                        e.stopPropagation()
                                                        await setDefaultAccountMutation({
                                                            householdId: account.householdId,
                                                            accountId: isDefault ? null : account.id
                                                        })
                                                        await refetchMembership()
                                                    }}>
                                                <Star className={cn("h-4 w-4", isDefault && "fill-current")} />
                                            </Button>
                                        </div>
                                    )
                                }
                            }
                        ]}
                    />
                </Suspense>
            </Section>

            <Section title={"Members"}
                     subtitle={"Manage household members and their roles."}>
                <Suspense fallback={<div>Loading members...</div>}>
                    <HouseholdMemberList householdId={household.id} />
                </Suspense>
            </Section>
        </div>
    )
})
