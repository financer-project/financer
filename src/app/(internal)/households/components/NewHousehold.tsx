"use client"
import { FORM_ERROR, HouseholdForm } from "./HouseholdForm"
import { CreateHouseholdSchema } from "../schemas"
import { useMutation } from "@blitzjs/rpc"
import createHousehold from "../mutations/createHousehold"
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
        } catch (error: any) {
          console.error(error)
          return {
            [FORM_ERROR]: error.toString(),
          }
        }
      }}
    />
  )
}
