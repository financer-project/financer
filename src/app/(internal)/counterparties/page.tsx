import { Metadata } from "next"
import { Suspense } from "react"
import { CounterpartiesList } from "./components/CounterpartiesList"
import {
    Page,
    PageHeader,
    PageTitle,
    PageDescription,
    PageContent
} from "@/src/lib/components/content/page"

export const metadata: Metadata = {
    title: "Counterparties",
    description: "List of counterparties"
}

export default function CounterpartiesPage() {
    return (
        <Page>
            <PageHeader items={[{ label: "Counterparties" }]}>
                <PageTitle>Counterparties</PageTitle>
                <PageDescription>Here can you find all your counterparties.</PageDescription>
            </PageHeader>
            <PageContent>
                <Suspense fallback={<div>Loading...</div>}>
                    <CounterpartiesList />
                </Suspense>
            </PageContent>
        </Page>
    )
}
