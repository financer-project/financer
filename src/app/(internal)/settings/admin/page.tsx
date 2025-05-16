import { Metadata } from "next"
import { Suspense } from "react"
import Header from "@/src/lib/components/content/nav/Header"
import { AdminSettings } from "@/src/app/(internal)/settings/admin/components/AdminSettings"
import { BlitzPage } from "@blitzjs/next"
import { Role } from "@prisma/client"

export const metadata: Metadata = {
    title: "Admin Settings",
    description: "Configure admin settings"
}

const AdminSettingsPage: BlitzPage = () => {
    return (
        <>
            <Header title={"Admin Settings"}
                    subtitle={"Configure system-wide settings."}
                    breadcrumbs={[
                        { label: "Settings", url: "/settings" },
                        { label: "Admin Settings" }
                    ]} />
            <Suspense fallback={<div>Loading...</div>}>
                <AdminSettings />
            </Suspense>
        </>
    )
}

AdminSettingsPage.authenticate = { role: Role.ADMIN }

export default AdminSettingsPage