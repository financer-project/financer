"use client"
import { AccountForm } from "./AccountForm"
import { CreateAccountSchema } from "../../../../../../lib/model/account/schemas"
import { useMutation } from "@blitzjs/rpc"
import createAccount from "@/src/lib/model/account/mutations/createAccount"
import { useRouter } from "next/navigation"
import { FORM_ERROR } from "@/src/lib/components/common/form/Form"
import { useHouseholds } from "@/src/lib/components/provider/HouseholdProvider"

export function NewAccount({ householdId }: Readonly<{ householdId: string }>) {
    const [createAccountMutation] = useMutation(createAccount)
    const households = useHouseholds()
    const router = useRouter()
    return (
        <AccountForm
            submitText="Create Account"
            schema={CreateAccountSchema}
            households={households || []}
            initialValues={{ householdId: householdId, name: "", technicalName: "" }}
            onSubmit={async (values) => {
                try {
                    const account = await createAccountMutation(values)
                    router.push(`/households/${householdId}`)
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
