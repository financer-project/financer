"use client"
import { Suspense } from "react"
import updateAccount from "@/src/lib/model/account/mutations/updateAccount"
import getAccount from "@/src/lib/model/account/queries/getAccount"
import { UpdateAccountSchema } from "../../../../../../lib/model/account/schemas"
import { AccountForm, FORM_ERROR } from "./AccountForm"
import { useMutation, useQuery } from "@blitzjs/rpc"
import { useRouter } from "next/navigation"
import Section from "@/src/lib/components/common/structure/Section"
import { useHouseholds } from "@/src/lib/components/provider/HouseholdProvider"

export const EditAccount = ({ accountId }: { accountId: string }) => {
    const [account, { setQueryData }] = useQuery(
        getAccount,
        { id: accountId },
        { staleTime: Infinity }
    )
    const [updateAccountMutation] = useMutation(updateAccount)
    const router = useRouter()
    return (
        <div>
            <Section title={"Basic Information"}>
                <Suspense fallback={<div>Loading...</div>}>
                    <AccountForm
                        submitText="Update Account"
                        schema={UpdateAccountSchema}
                        households={useHouseholds()}
                        initialValues={{ ...account, technicalName: account.technicalName ?? undefined }}
                        onSubmit={async (values) => {
                            try {
                                const updated = await updateAccountMutation({
                                    ...values,
                                    id: account.id
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
            </Section>
        </div>
    )
}
