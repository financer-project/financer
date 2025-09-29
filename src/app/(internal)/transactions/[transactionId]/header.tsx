"use client"

import { Button } from "@/src/lib/components/ui/button"
import Link from "next/link"
import { useMutation } from "@blitzjs/rpc"
import deleteTransaction from "@/src/lib/model/transactions/mutations/deleteTransaction"
import { useRouter } from "next/navigation"
import Header from "@/src/lib/components/content/nav/Header"
import { ConfirmationDialog } from "@/src/lib/components/common/dialog/ConfirmationDialog"
import { TransactionModel } from "@/src/lib/model/transactions/queries/getTransaction"
import { CirclePlus } from "lucide-react"

const TransactionHeader = ({ transaction }: { transaction: TransactionModel }) => {
    const [deleteTransactionMutation] = useMutation(deleteTransaction)
    const router = useRouter()

    const renderActions = (transaction: TransactionModel) => (
        <div className={"flex flex-row gap-2"}>
            <Button variant={"outline"} asChild>
                <Link href={`/transactions/new`}><CirclePlus />Create more</Link>
            </Button>
            <Button variant={"outline"} asChild>
                <Link href={`/transactions/${transaction.id}/edit`}>Edit</Link>
            </Button>
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
        </div>
    )

    return (
        <Header title={"Transaction"}
                breadcrumbs={[
                    { label: "Transactions", url: "/transactions" },
                    { label: transaction.id }
                ]}
                actions={renderActions(transaction)} />
    )
}
export default TransactionHeader