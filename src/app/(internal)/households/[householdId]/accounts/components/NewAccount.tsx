"use client"

import { AccountForm } from "./AccountForm"
import { CreateAccountSchema } from "@/src/lib/model/account/schemas"
import { useMutation } from "@blitzjs/rpc"
import createAccount from "@/src/lib/model/account/mutations/createAccount"
import { useRouter } from "next/navigation"
import { FORM_ERROR } from "@/src/lib/components/common/form/Form"

export function NewAccount({ householdId }: Readonly<{ householdId: string }>) {
    const [createAccountMutation] = useMutation(createAccount)
    const router = useRouter()
    return (
        <AccountForm
            submitText="Create Account"
            schema={CreateAccountSchema}
            initialValues={{ householdId: householdId, name: "", technicalIdentifier: null }}
            onSubmit={async (values) => {
                try {
                    const newAccount = await createAccountMutation(values)
                    router.push(`/households/${householdId}/accounts/${newAccount.id}`)
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
