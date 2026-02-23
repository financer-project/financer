import { Metadata } from "next"
import { Suspense } from "react"
import { NewTransactionTemplate } from "@/src/app/(internal)/transaction-templates/components/NewTransactionTemplate"
import { Page, PageContent, PageDescription, PageHeader, PageTitle } from "@/src/lib/components/content/page"

export const metadata: Metadata = {
    title: "New Transaction Template",
    description: "Create a new recurring transaction template"
}

export default function NewTransactionTemplatePage() {
    return (
        <Page>
            <PageHeader items={[
                { label: "Transaction Templates", url: "/transaction-templates" },
                { label: "New" }
            ]}>
                <PageTitle>Create Transaction Template</PageTitle>
                <PageDescription>Set up a new recurring transaction template.</PageDescription>
            </PageHeader>
            <PageContent>
                <Suspense fallback={<div>Loading...</div>}>
                    <NewTransactionTemplate />
                </Suspense>
            </PageContent>
        </Page>
    )
}
