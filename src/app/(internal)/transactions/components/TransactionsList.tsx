"use client"
import { usePaginatedQuery, useQuery } from "@blitzjs/rpc"
import getTransactions from "@/src/lib/model/transactions/queries/getTransactions"
import { DataTable, FilterConfig, TableColumn, useDataTable } from "@/src/lib/components/common/data/table"
import withFormatters, { WithFormattersProps } from "@/src/lib/util/formatter/withFormatters"
import ColoredTag from "@/src/lib/components/content/categories/ColoredTag"
import { useCurrentHousehold } from "@/src/lib/components/provider/HouseholdProvider"
import { Badge } from "@/src/lib/components/ui/badge"
import CounterpartyIcon from "@/src/lib/components/content/counterparties/CounterpartyIcon"
import getImportJobs from "@/src/lib/model/imports/queries/getImportJobs"
import { format as formatDate } from "date-fns"
import { TransactionModel } from "@/src/lib/model/transactions/queries/getTransaction"
import { useCategories } from "@/src/lib/components/provider/CategoryProvider"
import { useAccounts } from "@/src/lib/components/provider/AccountProvider"
import { useCounterparties } from "@/src/lib/components/provider/CounterpartyProvider"
import { useAuthorize } from "@/src/lib/guard/hooks/useAuthorize"
import { Prisma } from "@prisma/client"
import { useTags } from "@/src/lib/components/provider/TagProvider"

export const TransactionsList = withFormatters(({ formatters, hideFilters = false }: WithFormattersProps & {
    hideFilters?: boolean
}) => {
    const currentHousehold = useCurrentHousehold()!

    // Load options for filters
    const accounts = useAccounts()
    const categories = useCategories()
    const counterparties = useCounterparties()
    const tags = useTags()
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
                                    label={tagRelation.tag.name} />
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
            options: [
                { label: "Uncategorized", value: "null", render: label => (<ColoredTag label={label} />) },
                ...categories.flatten().map((c) => ({
                    label: c.data.name,
                    value: c.data.id,
                    render: (label: string) => (<ColoredTag color={c.data.color} label={label} />)
                }))
            ]
        },
        {
            type: "select",
            label: "Tag",
            property: "tagId",
            multiSelect: true,
            options: tags.map((tag) => ({ label: tag.name, value: tag.id }))
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

    const {
        page,
        pageSize,
        where
    } = useDataTable<TransactionModel, import("@/src/lib/db").Prisma.TransactionWhereInput>({
        filters,
        search: searchConfig,
        defaultPageSize: 25
    })

    const [{ transactions, count }] = usePaginatedQuery(getTransactions, {
        skip: pageSize * page,
        take: pageSize,
        householdId: currentHousehold.id,
        where
    })

    const canCreateTransaction = useAuthorize("create", Prisma.ModelName.Transaction, {}, true)

    return (
        <div>
            <DataTable data={transactions}
                       filters={hideFilters ? undefined : filters}
                       search={hideFilters ? undefined : {
                           fields: searchConfig.fields,
                           paramKey: searchConfig.paramKey,
                           placeholder: "Search transactions"
                       }}
                       columns={columns}
                       itemRoute={transaction => `/transactions/${transaction.id}`}
                       createRoute={canCreateTransaction ? "/transactions/new" : undefined}
                       count={count} />
        </div>
    )
})
