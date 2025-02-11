import { Metadata } from "next"
import { Suspense } from "react"
import { EditSetting } from "@/src/app/(internal)/settings/components/EditSetting"
import Header from "@/src/lib/components/content/nav/Header"

export const metadata: Metadata = {
    title: "Settings",
    description: "List of settings"
}

export default function Page() {
    return (
        <div>
            <Header title={"Settings"}
                    subtitle={"Here is a list of all settings."}
                    breadcrumbs={[{ label: "Settings" }]} />
            <Suspense fallback={<div>Loading...</div>}>
                <EditSetting />
            </Suspense>
        </div>
    )
}
