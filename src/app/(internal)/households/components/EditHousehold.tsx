"use client"
import { Suspense } from "react"
import updateHousehold from "@/src/lib/model/household/mutations/updateHousehold"
import getHousehold from "@/src/lib/model/household/queries/getHousehold"
import { UpdateHouseholdSchema } from "@/src/lib/model/household/schemas"
import { FORM_ERROR, HouseholdForm } from "./HouseholdForm"
import { useMutation, useQuery } from "@blitzjs/rpc"
import { useRouter } from "next/navigation"
import Section from "@/src/lib/components/common/structure/Section"
import { useToast } from "@/src/lib/hooks/use-toast"

export const EditHousehold = ({ householdId }: { householdId: string }) => {
    const { toast } = useToast()

    const [household, { setQueryData }] = useQuery(
        getHousehold,
        { id: householdId },
        { staleTime: Infinity }
    )
    const [updateHouseholdMutation] = useMutation(updateHousehold)
    const router = useRouter()
    return (
        <div>
            <Section title={"Basic Information"}>
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
                                toast({
                                    title: "Updated Household!",
                                    description: `Your changes to the household "${updated.name}" have been successfully applied.`
                                })
                            } catch (error: any) { //eslint-disable-line @typescript-eslint/no-explicit-any
                                return {
                                    [FORM_ERROR]: error.toString()
                                }
                            }
                        }}
                    />
                </Suspense>
            </Section>
        </div>
    )
}