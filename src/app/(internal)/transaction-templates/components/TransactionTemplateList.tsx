"use client"

import { invalidateQuery, useMutation, usePaginatedQuery } from "@blitzjs/rpc"
import getTransactionTemplates from "@/src/lib/model/transactionTemplates/queries/getTransactionTemplates"
import deleteTransactionTemplate from "@/src/lib/model/transactionTemplates/mutations/deleteTransactionTemplate"
import toggleTransactionTemplate from "@/src/lib/model/transactionTemplates/mutations/toggleTransactionTemplate"
import { DataTable, useDataTable } from "@/src/lib/components/common/data/table"
import withFormatters, { WithFormattersProps } from "@/src/lib/util/formatter/withFormatters"
import { useCurrentHousehold } from "@/src/lib/components/provider/HouseholdProvider"
import { Badge } from "@/src/lib/components/ui/badge"
import { Switch } from "@/src/lib/components/ui/switch"
import { RecurrenceFrequency, TransactionType } from "@prisma/client"
import type { Prisma } from "@/src/lib/db"
import { ConfirmationDialog } from "@/src/lib/components/common/dialog/ConfirmationDialog"
import { Button } from "@/src/lib/components/ui/button"
import Link from "next/link"
import { Edit, Trash } from "lucide-react"

export const TransactionTemplateList = withFormatters(({ formatters }: WithFormattersProps) => {
    const currentHousehold = useCurrentHousehold()!
    const [deleteTemplateMutation] = useMutation(deleteTransactionTemplate)
    const [toggleMutation] = useMutation(toggleTransactionTemplate)

    const { page, pageSize, where } = useDataTable<
        unknown,
        Prisma.TransactionTemplateWhereInput
    >({ defaultPageSize: 25 })

    const [{ transactionTemplates, count }] = usePaginatedQuery(getTransactionTemplates, {
        skip: pageSize * page,
        take: pageSize,
        householdId: currentHousehold.id,
        where
    })

    const frequencyLabel: Record<RecurrenceFrequency, string> = {
        [RecurrenceFrequency.DAILY]: "Daily",
        [RecurrenceFrequency.WEEKLY]: "Weekly",
        [RecurrenceFrequency.MONTHLY]: "Monthly",
        [RecurrenceFrequency.YEARLY]: "Yearly"
    }

    const typeVariant = (type: TransactionType): "default" | "destructive" | "secondary" => {
        if (type === TransactionType.INCOME) return "default"
        if (type === TransactionType.EXPENSE) return "destructive"
        return "secondary"
    }

    return (
        <DataTable
            data={transactionTemplates}
            count={count}
            createRoute={"/transaction-templates/new"}
            itemRoute={template => `/transaction-templates/${template.id}`}
            columns={[
                {
                    name: "Name",
                    render: template => template.name,
                    isKey: true
                },
                {
                    name: "Type",
                    render: template => (
                        <Badge variant={typeVariant(template.type)}>
                            {template.type}
                        </Badge>
                    )
                },
                {
                    name: "Amount",
                    render: template => (
                        <Badge variant={"secondary"} className={"font-mono"}>
                            {formatters.amount.format(template.amount)}
                        </Badge>
                    )
                },
                {
                    name: "Frequency",
                    render: template => frequencyLabel[template.frequency]
                },
                {
                    name: "Next Due Date",
                    render: template => formatters.date.format(template.nextDueDate)
                },
                {
                    name: "Actions",
                    render: template => (
                        <div className={"flex flex-row gap-2 items-center"} onClick={e => e.stopPropagation()}>
                            <Switch
                                checked={template.isActive}
                                onCheckedChange={async (checked) => {
                                    await toggleMutation({ id: template.id, isActive: checked })
                                    await invalidateQuery(getTransactionTemplates)
                                }} />
                            <Button variant={"outline"} size={"sm"} asChild>
                                <Link href={`/transaction-templates/${template.id}/edit`}><Edit /></Link>
                            </Button>
                            <Button
                                variant={"destructive"}
                                size={"sm"}
                                onClick={async () => {
                                    const confirmed = await ConfirmationDialog({
                                        title: "Delete transaction template?",
                                        description: "This will permanently delete the template. Existing transactions generated from it will not be affected."
                                    })
                                    if (confirmed) {
                                        await deleteTemplateMutation({ id: template.id })
                                        await invalidateQuery(getTransactionTemplates)
                                    }
                                }}>
                                <Trash />
                            </Button>
                        </div>
                    )
                }
            ]}
        />
    )
})
