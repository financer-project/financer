"use client"
import { Suspense, useState } from "react"
import { useMutation, useQuery } from "@blitzjs/rpc"
import { useRouter } from "next/navigation"
import { useSession } from "@blitzjs/auth"
import { FORM_ERROR } from "@/src/lib/components/common/form/Form"
import { AdminSettingsForm } from "./AdminSettingsForm"
import getAdminSettings from "@/src/lib/model/settings/queries/getAdminSettings"
import updateAdminSettings from "@/src/lib/model/settings/mutations/updateAdminSettings"
import sendTestEmail from "@/src/lib/model/settings/mutations/sendTestEmail"
import { toast } from "@/src/lib/hooks/use-toast"
import { UpdateAdminSettingsSchema } from "@/src/lib/model/settings/schemas/adminSettings"

export const AdminSettings = () => {
    const [adminSettings, { setQueryData }] = useQuery(
        getAdminSettings,
        { staleTime: Infinity }
    )
    const [updateAdminSettingsMutation] = useMutation(updateAdminSettings)
    const [sendTestEmailMutation] = useMutation(sendTestEmail)
    const [isSendingTestEmail, setIsSendingTestEmail] = useState(false)
    const router = useRouter()
    const session = useSession()

    const handleSendTestEmail = async (testEmailRecipient: string) => {
        try {
            setIsSendingTestEmail(true)
            await sendTestEmailMutation({
                ...adminSettings,
                smtpHost: adminSettings.smtpHost ?? "",
                smtpPort: adminSettings.smtpPort ?? 587,
                smtpUser: adminSettings.smtpUser ?? "",
                smtpPassword: adminSettings.smtpPassword ?? "",
                smtpFromEmail: adminSettings.smtpFromEmail ?? "",
                smtpFromName: adminSettings.smtpFromName ?? "Financer App",
                smtpEncryption: adminSettings.smtpEncryption ?? "none",
                testEmailRecipient: testEmailRecipient
            })
            toast({
                title: "Test email sent successfully!",
                variant: "default"
            })
        } catch (error: any) { //eslint-disable-line @typescript-eslint/no-explicit-any
            toast({
                title: `Failed to send test email`,
                description: `Error: ${error.toString()}`,
                variant: "destructive"
            })
        } finally {
            setIsSendingTestEmail(false)
        }
    }

    return (
        <div>
            <Suspense fallback={<div>Loading...</div>}>
                <AdminSettingsForm
                    submitText="Update Settings"
                    initialValues={adminSettings}
                    schema={UpdateAdminSettingsSchema}
                    onSendTestEmail={handleSendTestEmail}
                    isSendingTestEmail={isSendingTestEmail}
                    defaultTestEmailRecipient={session.email}
                    onSubmit={async (values) => {
                        try {
                            const updated = await updateAdminSettingsMutation(values)
                            await setQueryData(updated)
                            toast({ title: "Settings updated successfully!" })
                            router.refresh()
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
