import { Metadata } from "next"
import Header from "@/src/lib/components/content/nav/Header"
import { Suspense } from "react"
import { ImportWizard } from "../components/ImportWizard"
import { AccountProvider } from "@/src/lib/components/provider/AccountProvider"
import { CategoryProvider } from "@/src/lib/components/provider/CategoryProvider"

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
                        { label: "Transactions", url: "/transactions" },
                        { label: "Imports", url: "/imports" },
                        { label: "New Import" }
                    ]} />
            <Suspense fallback={<div>Loading...</div>}>
                <AccountProvider>
                    <CategoryProvider>
                        <ImportWizard />
                    </CategoryProvider>
                </AccountProvider>
            </Suspense>
        </div>
    )
}