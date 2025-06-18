"use client"
import { CounterpartyForm } from "./CounterpartyForm"
import { CreateCounterpartySchema } from "@/src/lib/model/counterparties/schemas"
import { useMutation } from "@blitzjs/rpc"
import createCounterparty from "@/src/lib/model/counterparties/mutations/createCounterparty"
import { useRouter } from "next/navigation"
import { FORM_ERROR } from "@/src/lib/components/common/form/Form"

export function NewCounterparty() {
    const [createCounterpartyMutation] = useMutation(createCounterparty)
    const router = useRouter()
    return (
        <CounterpartyForm
            submitText="Create Counterparty"
            schema={CreateCounterpartySchema}
            onSubmit={async (values) => {
                try {
                    await createCounterpartyMutation(values)
                    router.push(`/counterparties`)
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