import { Metadata } from "next"
import { Suspense } from "react"
import { HouseholdsList } from "./components/HouseholdsList"
import {
    Page as PageWrapper,
    PageHeader,
    PageTitle,
    PageDescription,
    PageContent
} from "@/src/lib/components/content/page"

export const metadata: Metadata = {
    title: "Households",
    description: "List of households"
}

export default function Page() {
    return (
        <PageWrapper>
            <PageHeader items={[{ label: "Households" }]}>
                <PageTitle>Households</PageTitle>
                <PageDescription>Here is a list of all households.</PageDescription>
            </PageHeader>
            <PageContent>
                <Suspense fallback={<div>Loading...</div>}>
                    <HouseholdsList />
                </Suspense>
            </PageContent>
        </PageWrapper>
    )
}
