import { Metadata } from "next"
import { Suspense } from "react"
import { NewAccount } from "../components/NewAccount"
import {
    Page,
    PageHeader,
    PageTitle,
    PageContent
} from "@/src/lib/components/content/page"
import { invoke } from "@/src/app/blitz-server"
import getHousehold from "@/src/lib/model/household/queries/getHousehold"
import { Household } from "@prisma/client"

async function fetchHousehold(householdId: string): Promise<Household> {
    return invoke(getHousehold, { id: householdId })
}

export async function generateMetadata(props: HouseholdPageProps): Promise<Metadata> {
    const params = await props.params
    const household = await fetchHousehold(params.householdId)
    return {
        title: `Create new account for household ${household.name}`
    }
}

type HouseholdPageProps = {
    params: Promise<{ householdId: string }>
}

export default async function NewHouseholdPage(props: Readonly<HouseholdPageProps>) {
    const params = await props.params
    const household = await fetchHousehold(params.householdId)

    return (
        <Page>
            <PageHeader items={[
                { label: "Households", url: "/households" },
                { label: household.name, url: `/households/${params.householdId}` },
                { label: "New Account" }
            ]}>
                <PageTitle>New Account</PageTitle>
            </PageHeader>
            <PageContent>
                <Suspense fallback={<div>Loading...</div>}>
                    <NewAccount householdId={params.householdId} />
                </Suspense>
            </PageContent>
        </Page>
    )
}
