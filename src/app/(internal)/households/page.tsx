import { Metadata } from "next"
import { Suspense } from "react"
import { HouseholdsList } from "./components/HouseholdsList"
import {
    Page,
    PageHeader,
    PageTitle,
    PageDescription,
    PageContent
} from "@/src/lib/components/content/page"

export const metadata: Metadata = {
    title: "Households",
    description: "List of households"
}

export default function HouseholdListPage() {
    return (
        <Page>
            <PageHeader items={[{ label: "Households" }]}>
                <PageTitle>Households</PageTitle>
                <PageDescription>Here is a list of all households.</PageDescription>
            </PageHeader>
            <PageContent>
                <Suspense fallback={<div>Loading...</div>}>
                    <HouseholdsList />
                </Suspense>
            </PageContent>
        </Page>
    )
}
