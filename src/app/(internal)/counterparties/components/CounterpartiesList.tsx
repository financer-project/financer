"use client"
import { usePaginatedQuery } from "@blitzjs/rpc"
import getCounterparties from "@/src/lib/model/counterparties/queries/getCounterparties"
import { DataTable, useDataTable } from "@/src/lib/components/common/data/table"
import withFormatters, { WithFormattersProps } from "@/src/lib/util/formatter/withFormatters"
import { useCurrentHousehold } from "@/src/lib/components/provider/HouseholdProvider"
import CounterpartyIcon from "@/src/lib/components/content/counterparties/CounterpartyIcon"

export const CounterpartiesList = withFormatters(({ formatters }: WithFormattersProps) => {
    const currentHousehold = useCurrentHousehold()!
    const { page, pageSize } = useDataTable({ defaultPageSize: 25 })
    const [{ counterparties, count }] = usePaginatedQuery(getCounterparties, {
        skip: pageSize * page,
        take: pageSize,
        householdId: currentHousehold.id
    })

    return (
        <DataTable
            data={counterparties}
            columns={[
                { name: "Name", render: counterparty => counterparty.name, isKey: true },
                {
                    name: "Type",
                    render: counterparty =>
                        <CounterpartyIcon type={counterparty.type}
                                          name={formatters.capitalize.format(counterparty.type.toLowerCase().replace("_", " "))} />

                },
                {
                    name: "Description",
                    render: counterparty => counterparty.description ??
                        <span className={"text-muted-foreground"}>No description</span>
                },
                {
                    name: "Account Name",
                    render: counterparty => counterparty.accountName ??
                        <span className={"text-muted-foreground"}>No account name</span>
                },
                {
                    name: "Web Address",
                    render: counterparty => counterparty.webAddress ??
                        <span className={"text-muted-foreground"}>No web address</span>
                },
                {
                    name: "Created",
                    render: counterparty => formatters.date.format(counterparty.createdAt)
                }
            ]}
            itemRoute={counterparty => `/counterparties/${counterparty.id}`}
            count={count}
            createRoute="/counterparties/new" />
    )
})
