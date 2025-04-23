import { Metadata } from "next"
import Header from "@/src/lib/components/content/nav/Header"
import { Suspense } from "react"
import { ImportWizard } from "../components/ImportWizard"

export const metadata: Metadata = {
    title: "New Import",
    description: "Import transactions from a CSV file"
}

export default function Page() {
    return (
        <div>
            <Header title={"New Import"}
                    subtitle={"Import transactions from a CSV file."}
                    breadcrumbs={[
                        { label: "Imports", href: "/imports" },
                        { label: "New Import" }
                    ]} />
            <Suspense fallback={<div>Loading...</div>}>
                <div className="p-4">
                    <ImportWizard />
                </div>
            </Suspense>
        </div>
    )
}