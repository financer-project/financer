"use client"

import { TransactionTemplateForm } from "./TransactionTemplateForm"
import { UpdateTransactionTemplateSchema } from "@/src/lib/model/transactionTemplates/schemas"
import { useMutation, useQuery } from "@blitzjs/rpc"
import updateTransactionTemplate from "@/src/lib/model/transactionTemplates/mutations/updateTransactionTemplate"
import getTransactionTemplate from "@/src/lib/model/transactionTemplates/queries/getTransactionTemplate"
import { useRouter } from "next/navigation"
import { FORM_ERROR } from "@/src/lib/components/common/form/Form"
import { AccountProvider } from "@/src/lib/components/provider/AccountProvider"
import { CategoryProvider } from "@/src/lib/components/provider/CategoryProvider"
import { CounterpartyProvider } from "@/src/lib/components/provider/CounterpartyProvider"

export function EditTransactionTemplate({ templateId }: Readonly<{ templateId: string }>) {
    const [updateMutation] = useMutation(updateTransactionTemplate)
    const [template] = useQuery(getTransactionTemplate, { id: templateId })
    const router = useRouter()

    return (
        <AccountProvider>
            <CategoryProvider>
                <CounterpartyProvider>
                    <TransactionTemplateForm
                        submitText="Save Template"
                        schema={UpdateTransactionTemplateSchema}
                        initialValues={{
                            ...template,
                            accountId: template.accountId,
                            categoryId: template.categoryId ?? null,
                            counterpartyId: template.counterpartyId ?? null
                        }}
                        onSubmit={async (values) => {
                            try {
                                await updateMutation({ ...values, id: templateId })
                                router.push(`/transaction-templates/${templateId}`)
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
