"use client"
import { usePaginatedQuery, useQuery } from "@blitzjs/rpc"
import getHousehold from "@/src/lib/model/household/queries/getHousehold"
import DataItem from "@/src/lib/components/common/data/DataItem"
import { DataItemContainer } from "@/src/lib/components/common/data/DataItemContainer"
import { Suspense } from "react"
import { DataTable, useDataTable } from "@/src/lib/components/common/data/table"
import getAccounts from "@/src/lib/model/account/queries/getAccounts"
import Section from "@/src/lib/components/common/structure/Section"
import withFormatters, { WithFormattersProps } from "@/src/lib/util/formatter/withFormatters"
import { Badge } from "@/src/lib/components/ui/badge"

export const Household = withFormatters(({ formatters, householdId }: WithFormattersProps & {
    householdId: string
}) => {
    const [household] = useQuery(getHousehold, { id: householdId })

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
                                    <span className={"font-semibold"}>{account.name}</span>,
                                isKey: true
                            },
                            {
                                name: "Technical Name",
                                render: (account) => account.technicalIdentifier
                            }
                        ]}
                    />
                </Suspense>
            </Section>

            <Section title={"Members"}
                     subtitle={"Manage household members and their roles."}>
                <Suspense fallback={<div>Loading members...</div>}>
                    <DataTable
                        data={household.members}
                        columns={[
                            { name: "Name", render: (member) => formatters.user.format(member.user) },
                            { name: "Email", render: (member) => member.user.email },
                            { name: "Role", render: (member) => <Badge variant={"secondary"}>{member.role}</Badge> }
                        ]} />
                </Suspense>
            </Section>
        </div>
    )
})
