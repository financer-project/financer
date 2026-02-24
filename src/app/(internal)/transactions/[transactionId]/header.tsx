"use client"

import { Button } from "@/src/lib/components/ui/button"
import Link from "next/link"
import { useMutation } from "@blitzjs/rpc"
import deleteTransaction from "@/src/lib/model/transactions/mutations/deleteTransaction"
import { useRouter } from "next/navigation"
import { PageActions, PageDescription, PageHeader, PageTitle } from "@/src/lib/components/content/page"
import { ConfirmationDialog } from "@/src/lib/components/common/dialog/ConfirmationDialog"
import { TransactionModel } from "@/src/lib/model/transactions/queries/getTransaction"
import { CirclePlus, LayoutTemplate } from "lucide-react"
import { useAuthorize } from "@/src/lib/guard/hooks/useAuthorize"
import { Prisma } from "@prisma/client"

const TransactionHeader = ({ transaction }: { transaction: TransactionModel }) => {
    const [deleteTransactionMutation] = useMutation(deleteTransaction)
    const router = useRouter()

    const canCreateMore = useAuthorize("create", Prisma.ModelName.Transaction, {}, true)
    const canCreateTemplate = useAuthorize("create", Prisma.ModelName.TransactionTemplate, {}, true)
    const canEdit = useAuthorize("update", Prisma.ModelName.Transaction, { id: transaction.id })
    const canDelete = useAuthorize("delete", Prisma.ModelName.Transaction, { id: transaction.id })

    const renderActions = (transaction: TransactionModel) => {
        const templateParams = new URLSearchParams()
        if (transaction.name) templateParams.set("name", transaction.name)
        templateParams.set("type", transaction.type)
        templateParams.set("amount", transaction.amount.toString())
        templateParams.set("accountId", transaction.accountId)
        if (transaction.description) templateParams.set("description", transaction.description)
        if (transaction.categoryId) templateParams.set("categoryId", transaction.categoryId)
        if (transaction.counterpartyId) templateParams.set("counterpartyId", transaction.counterpartyId)

        return (
        <div className={"flex flex-row gap-2"}>
            {canCreateMore && (
                <Button variant={"outline"} asChild>
                    <Link href={`/transactions/new`}><CirclePlus />Create more</Link>
                </Button>
            )}
            {canCreateTemplate && (
                <Button variant={"outline"} asChild>
                    <Link href={`/transaction-templates/new?${templateParams.toString()}`}><LayoutTemplate />Create Template</Link>
                </Button>
            )}
            {canEdit && (
                <Button variant={"outline"} asChild>
                    <Link href={`/transactions/${transaction.id}/edit`}>Edit</Link>
                </Button>
            )}
            {canDelete && (
                <Button
                    variant={"destructive"}
                    onClick={async () => {
                        const confirmed = await ConfirmationDialog({
                            title: "Do you really want to delete this transaction?",
                            description: "Deleting a transaction is irreversible."
                        })

                        if (confirmed) {
                            await deleteTransactionMutation({ id: transaction.id })
                            router.push("/transactions")
                        }
                    }}>
                    Delete
                </Button>
            )}
        </div>
        )
    }

    return (
        <PageHeader items={[
            { label: "Transactions", url: "/transactions" },
            { label: transaction.name ?? transaction.category?.name ?? "Transaction Details" }
        ]}>
            <PageTitle>{transaction.name ?? transaction.category?.name ?? "Transaction"}</PageTitle>
            <PageDescription>Here you can see all details of your transaction.</PageDescription>
            <PageActions>{renderActions(transaction)}</PageActions>
        </PageHeader>
    )
}
export default TransactionHeader