import { Metadata } from "next"
import React, { Suspense } from "react"
import { invoke } from "src/app/blitz-server"
import getHousehold from "@/src/lib/model/household/queries/getHousehold"
import { Household } from "../components/Household"
import Header from "./header"

export const dynamic = "force-dynamic";

export async function generateMetadata(props: HouseholdPageProps): Promise<Metadata> {
    const params = await props.params
    const Household = await invoke(getHousehold, { id: String(params.householdId) })
    return {
        title: `Household ${Household.name}`
    }
}

type HouseholdPageProps = {
    params: Promise<{ householdId: string }>
}

export default async function Page(props: Readonly<HouseholdPageProps>) {
    const params = await props.params

    return (
        <div>
            <Header householdId={params.householdId} />
            <Suspense fallback={<div>Loading...</div>}>
                <Household householdId={params.householdId} />
            </Suspense>

        </div>
    )
}
