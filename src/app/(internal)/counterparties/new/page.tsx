import { Metadata } from "next"
import { Suspense } from "react"
import { NewCounterparty } from "@/src/app/(internal)/counterparties/components/NewCounterparty"
import {
    Page,
    PageHeader,
    PageTitle,
    PageDescription,
    PageContent
} from "@/src/lib/components/content/page"

export const metadata: Metadata = {
    title: "New Counterparty",
    description: "Create a new counterparty"
}

export default function NewCounterpartyPage() {
    return (
        <Page>
            <PageHeader items={[
                { label: "Counterparties", url: "/counterparties" },
                { label: "New" }
            ]}>
                <PageTitle>Create new Counterparty</PageTitle>
                <PageDescription>Here can you create a new counterparty</PageDescription>
            </PageHeader>
            <PageContent>
                <Suspense fallback={<div>Loading...</div>}>
                    <NewCounterparty />
                </Suspense>
            </PageContent>
        </Page>
    )
}