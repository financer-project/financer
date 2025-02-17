"use client"
import { Suspense } from "react"
import updateTransaction from "@/src/lib/model/transactions/mutations/updateTransaction"
import getTransaction from "@/src/lib/model/transactions/queries/getTransaction"
import { UpdateTransactionSchema } from "@/src/lib/model/transactions/schemas"
import { TransactionForm } from "./TransactionForm"
import { useMutation, useQuery } from "@blitzjs/rpc"
import { useRouter } from "next/navigation"
import Header from "@/src/lib/components/content/nav/Header"
import { FORM_ERROR } from "@/src/lib/components/common/form/Form"

export const EditTransaction = ({ transactionId }: { transactionId: string }) => {
    const [transaction] = useQuery(getTransaction, { id: transactionId }, { staleTime: Infinity })
    const [updateTransactionMutation] = useMutation(updateTransaction)
    const router = useRouter()
    return (
        <div>
            <Header title="Edit Transaction"
                    subtitle={`Edit transaction ${transaction.id}`}
                    breadcrumbs={[
                        { label: "Transactions", url: "/transactions" },
                        { label: transaction.id, url: `/transactions/${transaction.id}` },
                        { label: "Edit" }
                    ]} />
            <Suspense fallback={<div>Loading...</div>}>
                <TransactionForm
                    submitText="Update Transaction"
                    schema={UpdateTransactionSchema}
                    initialValues={transaction}
                    onSubmit={async (values) => {
                        try {
                            await updateTransactionMutation({ ...values, id: transaction.id })
                            router.push(`/transactions/${transaction.id}`)
                        } catch (error: any) { //eslint-disable-line @typescript-eslint/no-explicit-any
                            console.error(error)
                            return {
                                [FORM_ERROR]: error.toString()
                            }
                        }
                    }}
                />
            </Suspense>
        </div>
    )
}
