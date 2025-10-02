import { Metadata } from "next"
import { Suspense } from "react"
import { AdminSettings } from "@/src/app/(internal)/settings/admin/components/AdminSettings"
import { BlitzPage } from "@blitzjs/next"
import { Role } from "@prisma/client"
import { Page, PageContent, PageDescription, PageHeader, PageTitle } from "@/src/lib/components/content/page"

export const metadata: Metadata = {
    title: "Admin Settings",
    description: "Configure admin settings"
}

const AdminSettingsPage: BlitzPage = () => {
    return (
        <Page>
            <PageHeader items={[
                { label: "Settings", url: "/settings" },
                { label: "Admin Settings" }
            ]}>
                <PageTitle>Admin Settings</PageTitle>
                <PageDescription>Configure system-wide settings.</PageDescription>
            </PageHeader>
            <PageContent>
                <Suspense fallback={<div>Loading...</div>}>
                    <AdminSettings />
                </Suspense>
            </PageContent>
        </Page>
    )
}

AdminSettingsPage.authenticate = { role: Role.ADMIN, redirectTo: "/dashboard" }

export default AdminSettingsPage