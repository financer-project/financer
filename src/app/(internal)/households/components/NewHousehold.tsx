"use client"
import { FORM_ERROR, HouseholdForm } from "./HouseholdForm"
import { CreateHouseholdSchema } from "@/src/lib/model/household/schemas"
import { useMutation } from "@blitzjs/rpc"
import createHousehold from "@/src/lib/model/household/mutations/createHousehold"
import { useRouter } from "next/navigation"

export function NewHouseholdForm() {
    const [createHouseholdMutation] = useMutation(createHousehold)
    const router = useRouter()
    return (
        <HouseholdForm
            submitText="Create Household"
            schema={CreateHouseholdSchema}
            onSubmit={async (values) => {
                try {
                    const household = await createHouseholdMutation(values)
                    router.push(`/households/${household.id}`)
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
