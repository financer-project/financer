"use client"
import { AccountForm } from "./AccountForm"
import { CreateAccountSchema } from "../schemas"
import { useMutation } from "@blitzjs/rpc"
import createAccount from "@/src/lib/model/account/mutations/createAccount"
import { useRouter } from "next/navigation"
import { FORM_ERROR } from "@/src/lib/components/common/form/Form"

export function NewAccount({ householdId }: { householdId: string }) {
    const [createAccountMutation] = useMutation(createAccount)
    const router = useRouter()
    return (
        <AccountForm
            submitText="Create Account"
            schema={CreateAccountSchema}
            householdId={householdId}
            onSubmit={async (values) => {
                try {
                    const account = await createAccountMutation(values)
                    router.push(`/accounts/${account.id}`)
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
