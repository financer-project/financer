import { Metadata } from "next"
import { Suspense } from "react"
import { Page, PageContent, PageDescription, PageHeader, PageTitle } from "@/src/lib/components/content/page"
import { EditProfile } from "@/src/app/(internal)/settings/components/EditProfile"
import { EditSetting } from "@/src/app/(internal)/settings/components/EditSetting"

export const metadata: Metadata = {
    title: "Settings",
    description: "Manage your account settings"
}

export default function SettingsPage() {
    return (
        <Page>
            <PageHeader items={[{ label: "Settings" }]}>
                <PageTitle>Settings</PageTitle>
                <PageDescription>Manage your account and application settings.</PageDescription>
            </PageHeader>
            <PageContent>
                <Suspense fallback={<div>Loading...</div>}>
                    <EditProfile />
                </Suspense>
                <Suspense fallback={<div>Loading...</div>}>
                    <EditSetting />
                </Suspense>
            </PageContent>
        </Page>
    )
}
