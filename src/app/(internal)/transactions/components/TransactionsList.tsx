"use client"
import { usePaginatedQuery, useQuery } from "@blitzjs/rpc"
import { useSearchParams } from "next/navigation"
import getTransactions from "@/src/lib/model/transactions/queries/getTransactions"
import { DataTable, TableColumn } from "@/src/lib/components/common/data/DataTable"
import withFormatters, { WithFormattersProps } from "@/src/lib/util/formatter/withFormatters"
import ColoredTag from "@/src/lib/components/content/categories/ColoredTag"
import { useCurrentHousehold } from "@/src/lib/components/provider/HouseholdProvider"
import { Badge } from "@/src/lib/components/ui/badge"
import CounterpartyIcon from "@/src/lib/components/content/counterparties/CounterpartyIcon"
import getAccounts from "@/src/lib/model/account/queries/getAccounts"
import getCategories from "@/src/lib/model/categories/queries/getCategories"
import getCounterparties from "@/src/lib/model/counterparties/queries/getCounterparties"
import getImportJobs from "@/src/lib/model/imports/queries/getImportJobs"
import { buildPrismaWhere } from "@/src/lib/components/common/data/table/filters/prisma-filter-builder"
import { FilterConfig } from "@/src/lib/components/common/data/table/filters/types"
import { format as formatDate } from "date-fns"
import { TransactionModel } from "@/src/lib/model/transactions/queries/getTransaction"

export const TransactionsList = withFormatters(({ formatters, itemsPerPage = 25 }: WithFormattersProps & {
    itemsPerPage?: number
}) => {
    const searchParams = useSearchParams()
    const currentHousehold = useCurrentHousehold()!
    const page = Number(searchParams?.get("page") ?? 0)

    // Load options for filters
    const [{ accounts }] = useQuery(getAccounts, { householdId: currentHousehold.id, take: 200 })
    const [categories] = useQuery(getCategories, { householdId: currentHousehold.id })
    const [{ counterparties }] = useQuery(getCounterparties, { householdId: currentHousehold.id, take: 200 })
    const [{ importJobs }] = useQuery(getImportJobs, { take: 200, orderBy: { createdAt: "desc" } })

    const columns: TableColumn<TransactionModel>[] = [
        {
            name: "Name",
            render: transaction => transaction.name,
            isKey: true
        },
        {
            name: "Category",
            render: transaction => transaction.category
                ? <ColoredTag color={transaction.category.color}
                              label={transaction.category.name} />
                : <span className={"text-muted-foreground"}>Uncategorized</span>
        },
        {
            name: "Tags",
            render: transaction => transaction.tags && transaction.tags.length > 0
                ? (
                    <div className="flex flex-wrap gap-2">
                        {transaction.tags.map((tagRelation) => (
                            <Badge key={tagRelation.tagId} variant={"secondary"}>
                                <ColoredTag
                                    color={tagRelation.tag.color}
                                    label={tagRelation.tag.name}
                                />
                            </Badge>
                        ))}
                    </div>
                )
                : <span className={"text-muted-foreground"}>No tags</span>
        },
        {
            name: "Counterparty",
            render: transaction => transaction.counterparty
                ? <CounterpartyIcon name={transaction.counterparty.name}
                                    type={transaction.counterparty.type} />
                : <span className={"text-muted-foreground"}>No counterparty</span>
        },
        {
            name: "Date",
            render: transaction => formatters.date.format(transaction.valueDate)
        },
        {
            name: "Amount",
            render: transaction =>
                <Badge variant={"secondary"} className={"font-mono"}>
                    {formatters.amount.format(transaction.amount)}
                </Badge>
        }
    ]

    // Define dynamic filters
    const filters: FilterConfig<TransactionModel>[] = [
        {
            type: "select",
            label: "Account",
            property: "accountId",
            multiSelect: true,
            options: accounts.map((a) => ({ label: a.name, value: a.id }))
        },
        {
            type: "select",
            label: "Category",
            property: "categoryId",
            multiSelect: true,
            options: categories.map((c) => ({ label: c.name, value: c.id }))
        },
        {
            type: "select",
            label: "Counterparty",
            property: "counterpartyId",
            multiSelect: true,
            options: counterparties.map((cp) => ({ label: cp.name, value: cp.id }))
        },
        {
            type: "select",
            label: "CSV Import",
            property: "importJobId",
            multiSelect: true,
            options: importJobs.map((job) => ({
                label: job.name ?? `Import ${formatDate(new Date(job.createdAt), "yyyy-MM-dd HH:mm")}`,
                value: job.id,
                render: (label: string) => (
                    <div className="flex flex-col leading-tight">
                        <span>{label}</span>
                        <span
                            className="text-xs text-muted-foreground">{formatDate(new Date(job.createdAt), "yyyy-MM-dd HH:mm")}</span>
                    </div>
                )
            }))
        },
        {
            type: "date",
            label: "Date",
            property: "valueDate"
        }
    ]

    const searchConfig = {
        fields: [
            "name",
            "description",
            "account.name",
            "category.name",
            "counterparty.name"
        ],
        paramKey: "q"
    }

    const where = buildPrismaWhere<TransactionModel, import("@/src/lib/db").Prisma.TransactionWhereInput>({
        searchParams: searchParams,
        filters,
        search: searchConfig
    })

    const [{ transactions, hasMore }] = usePaginatedQuery(getTransactions, {
        skip: itemsPerPage * page,
        take: itemsPerPage,
        householdId: currentHousehold.id,
        where
    })

    return (
        <div>
            <DataTable data={transactions}
                       filters={filters}
                       search={{
                           fields: searchConfig.fields,
                           paramKey: searchConfig.paramKey,
                           placeholder: "Search transactions"
                       }}
                       columns={columns}
                       itemRoute={transaction => `/transactions/${transaction.id}`}
                       hasMore={hasMore} />
        </div>
    )
})
