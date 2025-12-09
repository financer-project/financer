"use client"
import { usePaginatedQuery } from "@blitzjs/rpc"
import getCounterparties from "@/src/lib/model/counterparties/queries/getCounterparties"
import { DataTable, FilterConfig, useDataTable } from "@/src/lib/components/common/data/table"
import withFormatters, { WithFormattersProps } from "@/src/lib/util/formatter/withFormatters"
import { useCurrentHousehold } from "@/src/lib/components/provider/HouseholdProvider"
import CounterpartyIcon from "@/src/lib/components/content/counterparties/CounterpartyIcon"
import { CounterpartyType } from "@prisma/client"
import type { Prisma } from "@/src/lib/db"

export const CounterpartiesList = withFormatters(({ formatters }: WithFormattersProps) => {
    const currentHousehold = useCurrentHousehold()!

    // Define filters and search
    const filters: FilterConfig<import("@/src/lib/db").Prisma.CounterpartyGetPayload<{ select: { id: true } }>>[] = [
        {
            type: "select",
            label: "Type",
            property: "type",
            multiSelect: true,
            options: Object.values(CounterpartyType).map((type) => ({
                label: formatters.capitalize.format(type.toLowerCase().replace("_", " ")),
                value: type,
                render: label => <CounterpartyIcon type={type} name={label} />
            }))
        }
    ]

    const searchConfig = {
        fields: ["name", "description", "accountName", "webAddress"],
        paramKey: "q"
    }

    const { page, pageSize, where } = useDataTable<
        unknown,
        Prisma.CounterpartyWhereInput
    >({ defaultPageSize: 25, filters, search: searchConfig })

    const [{ counterparties, count }] = usePaginatedQuery(getCounterparties, {
        skip: pageSize * page,
        take: pageSize,
        householdId: currentHousehold.id,
        where
    })

    return (
        <DataTable
            data={counterparties}
            filters={filters}
            search={{
                fields: searchConfig.fields,
                paramKey: searchConfig.paramKey,
                placeholder: "Search counterparties"
            }}
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
