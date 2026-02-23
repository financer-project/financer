"use client"

import { TransactionTemplateForm } from "./TransactionTemplateForm"
import { CreateTransactionTemplateSchema } from "@/src/lib/model/transactionTemplates/schemas"
import { useMutation } from "@blitzjs/rpc"
import createTransactionTemplate from "@/src/lib/model/transactionTemplates/mutations/createTransactionTemplate"
import { useRouter } from "next/navigation"
import { FORM_ERROR } from "@/src/lib/components/common/form/Form"
import { AccountProvider } from "@/src/lib/components/provider/AccountProvider"
import { CategoryProvider } from "@/src/lib/components/provider/CategoryProvider"
import { CounterpartyProvider } from "@/src/lib/components/provider/CounterpartyProvider"

export function NewTransactionTemplate() {
    const [createMutation] = useMutation(createTransactionTemplate)
    const router = useRouter()

    return (
        <AccountProvider>
            <CategoryProvider>
                <CounterpartyProvider>
                    <TransactionTemplateForm
                        submitText="Create Template"
                        schema={CreateTransactionTemplateSchema}
                        onSubmit={async (values) => {
                            try {
                                const template = await createMutation(values)
                                router.push(`/transaction-templates/${template.id}`)
                            } catch (error: unknown) {
                                console.error(error)
                                return { [FORM_ERROR]: String(error) }
                            }
                        }}
                    />
                </CounterpartyProvider>
            </CategoryProvider>
        </AccountProvider>
    )
}
