import { Metadata } from "next"
import React, { Suspense } from "react"
import { invoke } from "src/app/blitz-server"
import getHousehold from "@/src/lib/model/household/queries/getHousehold"
import { Household } from "../components/Household"
import HouseholdHeader from "./header"
import { Household as HouseholdModel } from "@prisma/client"
import { Page, PageContent } from "@/src/lib/components/content/page"

export const dynamic = "force-dynamic"

async function fetchHousehold(householdId: string): Promise<HouseholdModel> {
    return invoke(getHousehold, { id: householdId })
}

export async function generateMetadata(props: HouseholdPageProps): Promise<Metadata> {
    const params = await props.params
    const household = await fetchHousehold(params.householdId)
    return {
        title: `Household ${household.name}`
    }
}

type HouseholdPageProps = {
    params: Promise<{ householdId: string }>
}

export default async function HouseholdDetailsPage(props: Readonly<HouseholdPageProps>) {
    const params = await props.params
    const household = await fetchHousehold(params.householdId)

    return (
        <Page>
            <HouseholdHeader household={household} />
            <PageContent>
                <Suspense fallback={<div>Loading...</div>}>
                    <Household householdId={params.householdId} />
                </Suspense>
            </PageContent>
        </Page>
    )
}
