import { Metadata } from "next"
import { Suspense } from "react"
import { NewHouseholdForm } from "../components/NewHousehold"
import { Page, PageContent, PageHeader, PageTitle } from "@/src/lib/components/content/page"

export const metadata: Metadata = {
    title: "New Household",
    description: "Create a new Household"
}

export default function NewHouseholdPage() {
    return (
        <Page>
            <PageHeader items={[
                { label: "Households", url: "/households" },
                { label: "New" }
            ]}>
                <PageTitle>Create a new Household</PageTitle>
            </PageHeader>
            <PageContent>
                <Suspense fallback={<div>Loading...</div>}>
                    <NewHouseholdForm />
                </Suspense>
            </PageContent>
        </Page>
    )
}
