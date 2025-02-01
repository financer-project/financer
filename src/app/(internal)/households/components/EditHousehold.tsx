"use client"
import { Suspense } from "react"
import updateHousehold from "@/src/lib/model/household/mutations/updateHousehold"
import getHousehold from "@/src/lib/model/household/queries/getHousehold"
import { UpdateHouseholdSchema } from "../schemas"
import { FORM_ERROR, HouseholdForm } from "./HouseholdForm"
import { useMutation, useQuery } from "@blitzjs/rpc"
import { useRouter } from "next/navigation"

export const EditHousehold = ({ householdId }: { householdId: string }) => {
    const [household, { setQueryData }] = useQuery(
        getHousehold,
        { id: householdId },
        {
            // This ensures the query never refreshes and overwrites the form data while the user is editing.
            staleTime: Infinity
        }
    )
    const [updateHouseholdMutation] = useMutation(updateHousehold)
    const router = useRouter()
    return (
        <>
            <div>
                <h1>Edit Household {household.id}</h1>
                <pre>{JSON.stringify(household, null, 2)}</pre>
                <Suspense fallback={<div>Loading...</div>}>
                    <HouseholdForm
                        submitText="Update Household"
                        schema={UpdateHouseholdSchema}
                        initialValues={household}
                        onSubmit={async (values) => {
                            try {
                                const updated = await updateHouseholdMutation({
                                    ...values,
                                    id: household.id
                                })
                                await setQueryData(updated)
                                router.refresh()
                            } catch (error: any) {
                                console.error(error)
                                return {
                                    [FORM_ERROR]: error.toString()
                                }
                            }
                        }}
                    />
                </Suspense>
            </div>
        </>
    )
}
