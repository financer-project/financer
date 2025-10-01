import { Metadata } from "next"
import {
    Page,
    PageHeader,
    PageTitle,
    PageDescription,
    PageContent
} from "@/src/lib/components/content/page"
import { Suspense } from "react"
import { ImportWizard } from "../components/ImportWizard"
import { AccountProvider } from "@/src/lib/components/provider/AccountProvider"
import { CategoryProvider } from "@/src/lib/components/provider/CategoryProvider"

export const metadata: Metadata = {
    title: "New Import",
    description: "Import transactions from a CSV file"
}

export default function NewImportPage() {
    return (
        <Page>
            <PageHeader items={[
                { label: "Transactions", url: "/transactions" },
                { label: "Imports", url: "/imports" },
                { label: "New Import" }
            ]}>
                <PageTitle>New Import</PageTitle>
                <PageDescription>Import transactions from a CSV file.</PageDescription>
            </PageHeader>
            <PageContent>
                <Suspense fallback={<div>Loading...</div>}>
                    <AccountProvider>
                        <CategoryProvider>
                            <ImportWizard />
                        </CategoryProvider>
                    </AccountProvider>
                </Suspense>
            </PageContent>
        </Page>
    )
}