"use client"

import { TransactionForm } from "./TransactionForm"
import { CreateTransactionSchema } from "@/src/lib/model/transactions/schemas"
import { useMutation } from "@blitzjs/rpc"
import createTransaction from "@/src/lib/model/transactions/mutations/createTransaction"
import { useRouter } from "next/navigation"
import { FORM_ERROR } from "@/src/lib/components/common/form/Form"

export function NewTransaction() {
    const [createTransactionMutation] = useMutation(createTransaction)
    const router = useRouter()
    return (
        <TransactionForm
            submitText="Create Transaction"
            schema={CreateTransactionSchema}
            onSubmit={async (values) => {
                try {
                    const transaction = await createTransactionMutation(values)
                    router.push(`/transactions/${transaction.id}`)
                } catch (error: any) {
                    console.error(error)
                    return {
                        [FORM_ERROR]: error.toString()
                    }
                }
            }}
        />
    )
}
