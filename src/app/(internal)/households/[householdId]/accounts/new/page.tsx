import { Metadata } from "next"
import { Suspense } from "react"
import { NewAccount } from "../components/NewAccount"
import Header from "@/src/lib/components/content/nav/Header"
import { invoke } from "@/src/app/blitz-server"
import getHousehold from "@/src/lib/model/household/queries/getHousehold"
import { Household } from "@prisma/client"

async function fetchHousehold(householdId: string): Promise<Household> {
    return await invoke(getHousehold, { id: householdId })
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

export default async function Page(props: Readonly<HouseholdPageProps>) {
    const params = await props.params
    const household = await fetchHousehold(params.householdId)

    return (
        <div>
            <Header title={"New Account"}
                    breadcrumbs={[
                        { label: "Households", url: "/households" },
                        { label: household.name, url: `/households/${params.householdId}` },
                        { label: "New" }]} />
            <Suspense fallback={<div>Loading...</div>}>
                <NewAccount householdId={params.householdId} />
            </Suspense>
        </div>
    )
}
