import { Metadata } from "next"
import { Suspense } from "react"
import { NewHouseholdForm } from "../components/NewHousehold"
import {
    Page as PageWrapper,
    PageHeader,
    PageTitle,
    PageContent
} from "@/src/lib/components/content/page"

export const metadata: Metadata = {
    title: "New Household",
    description: "Create a new Household"
}

export default function Page() {
    return (
        <PageWrapper>
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
        </PageWrapper>
    )
}
