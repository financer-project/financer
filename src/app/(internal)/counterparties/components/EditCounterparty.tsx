"use client"
import { Suspense } from "react"
import updateCounterparty from "@/src/lib/model/counterparties/mutations/updateCounterparty"
import getCounterparty from "@/src/lib/model/counterparties/queries/getCounterparty"
import { UpdateCounterpartySchema } from "@/src/lib/model/counterparties/schemas"
import { CounterpartyForm } from "./CounterpartyForm"
import { useMutation, useQuery } from "@blitzjs/rpc"
import { useRouter } from "next/navigation"
import { FORM_ERROR } from "@/src/lib/components/common/form/Form"

export const EditCounterparty = ({ counterpartyId }: { counterpartyId: string }) => {
    const [counterparty] = useQuery(getCounterparty, { id: counterpartyId }, { staleTime: Infinity })
    const [updateCounterpartyMutation] = useMutation(updateCounterparty)
    const router = useRouter()
    return (
        <div>
            <Suspense fallback={<div>Loading...</div>}>
                <CounterpartyForm
                    submitText="Update Counterparty"
                    schema={UpdateCounterpartySchema}
                    initialValues={counterparty}
                    onSubmit={async (values) => {
                        try {
                            await updateCounterpartyMutation({ ...values, id: counterparty.id })
                            router.push("/counterparties")
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