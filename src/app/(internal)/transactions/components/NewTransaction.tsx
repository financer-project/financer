"use client"

import { TransactionForm } from "./TransactionForm"
import { CreateTransactionSchema } from "@/src/lib/model/transactions/schemas"
import { useMutation } from "@blitzjs/rpc"
import createTransaction from "@/src/lib/model/transactions/mutations/createTransaction"
import { useRouter, useSearchParams } from "next/navigation"
import { FORM_ERROR } from "@/src/lib/components/common/form/Form"

export function NewTransaction() {
    const [createTransactionMutation] = useMutation(createTransaction)
    const router = useRouter()
    const searchParams = useSearchParams()

    // Read filter values from URL params to prefill the form
    const prefillFromFilters = {
        accountId: searchParams?.get("accountId") ?? undefined,
        categoryId: searchParams?.get("categoryId") ?? undefined,
        counterpartyId: searchParams?.get("counterpartyId") ?? undefined
    }

    return (
        <TransactionForm
            submitText="Create Transaction"
            schema={CreateTransactionSchema}
            prefillFromFilters={prefillFromFilters}
            onSubmit={async (values) => {
                try {
                    const transaction = await createTransactionMutation(values)
                    router.push(`/transactions/${transaction.id}`)
                } catch (error: any) { //eslint-disable-line @typescript-eslint/no-explicit-any
                    console.error(error)
                    return {
                        [FORM_ERROR]: error.toString()
                    }
                }
            }}
        />
    )
}
