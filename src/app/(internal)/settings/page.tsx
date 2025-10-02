import { Metadata } from "next"
import { Suspense } from "react"
import { EditSetting } from "@/src/app/(internal)/settings/components/EditSetting"
import { Page, PageContent, PageDescription, PageHeader, PageTitle } from "@/src/lib/components/content/page"

export const metadata: Metadata = {
    title: "Settings",
    description: "List of settings"
}

export default function SettingsPage() {
    return (
        <Page>
            <PageHeader items={[{ label: "Settings" }]}>
                <PageTitle>Settings</PageTitle>
                <PageDescription>Here is a list of all settings.</PageDescription>
            </PageHeader>
            <PageContent>
                <Suspense fallback={<div>Loading...</div>}>
                    <EditSetting />
                </Suspense>
            </PageContent>
        </Page>
    )
}
