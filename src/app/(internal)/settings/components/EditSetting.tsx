"use client"
import { Suspense } from "react"
import updateSetting from "@/src/lib/model/settings/mutations/updateSetting"
import getSetting from "@/src/lib/model/settings/queries/getSetting"
import { UpdateSettingSchema } from "../../../../lib/model/settings/schemas"
import { SettingForm } from "./SettingForm"
import { useMutation, useQuery } from "@blitzjs/rpc"
import { useRouter } from "next/navigation"
import { FORM_ERROR } from "@/src/lib/components/common/form/Form"

export const EditSetting = () => {
    const [setting, { setQueryData }] = useQuery(
        getSetting,
        { staleTime: Infinity }
    )
    const [updateSettingMutation] = useMutation(updateSetting)
    const router = useRouter()
    return (
        <div>
            <Suspense fallback={<div>Loading...</div>}>
                <SettingForm
                    submitText="Update Setting"
                    schema={UpdateSettingSchema}
                    initialValues={setting}
                    onSubmit={async (values) => {
                        try {
                            const updated = await updateSettingMutation({
                                ...values,
                                userId: setting.userId
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
    )
}
