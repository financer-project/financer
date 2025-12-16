"use client"
import { Suspense, useState } from "react"
import { useMutation, useQuery } from "@blitzjs/rpc"
import { useSession } from "@blitzjs/auth"
import { AdminSettingsForm } from "./AdminSettingsForm"
import getAdminSettings from "@/src/lib/model/settings/queries/getAdminSettings"
import updateAdminSettings from "@/src/lib/model/settings/mutations/updateAdminSettings"
import sendTestEmail from "@/src/lib/model/settings/mutations/sendTestEmail"
import { UpdateAdminSettingsSchema } from "@/src/lib/model/settings/schemas/adminSettings"
import { toast } from "sonner"

export const AdminSettings = () => {
    const [adminSettings, { setQueryData }] = useQuery(
        getAdminSettings,
        { staleTime: Infinity }
    )
    const [updateAdminSettingsMutation] = useMutation(updateAdminSettings)
    const [sendTestEmailMutation] = useMutation(sendTestEmail)
    const [isSendingTestEmail, setIsSendingTestEmail] = useState(false)
    const session = useSession()

    const handleSendTestEmail = (testEmailRecipient: string): Promise<void> => {
        setIsSendingTestEmail(true)
        const promise = sendTestEmailMutation({
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
        return new Promise(resolve => toast.promise(promise, {
            loading: "Sending test email...",
            success: () => {
                return "Test email sent successfully!"
            },
            error: (error) => ({
                message: "Failed to send test email",
                description: `Error: ${error.toString()}`
            }),
            finally: () => {
                setIsSendingTestEmail(false)
                resolve()
            }
        }))
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
                    onSubmit={(values) => {
                        const promise = updateAdminSettingsMutation(values)
                        toast.promise(promise, {
                            loading: "Updating settings...",
                            success: async (result) => {
                                await setQueryData(result)
                                return "Settings updated successfully!"
                            },
                            error: "Settings could not be updated."
                        })
                    }} />
            </Suspense>
        </div>
    )
}
