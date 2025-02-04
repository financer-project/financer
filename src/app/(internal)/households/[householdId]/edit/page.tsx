import { Metadata } from "next"
import { Suspense } from "react"
import { invoke } from "src/app/blitz-server"
import getHousehold from "@/src/lib/model/household/queries/getHousehold"
import { EditHousehold } from "../../components/EditHousehold"
import Header from "@/src/lib/components/content/nav/Header"
import { Household as HouseholdModel } from ".prisma/client"

async function fetchHousehold(householdId: string): Promise<HouseholdModel> {
    return await invoke(getHousehold, { id: householdId })
}

type EditHouseholdPageProps = {
    params: Promise<{ householdId: string }>
}

export async function generateMetadata(props: EditHouseholdPageProps): Promise<Metadata> {
    const params = await props.params
    const household = await fetchHousehold(params.householdId)
    return {
        title: `Edit Household ${household.id} - ${household.name}`
    }
}

export default async function Page(props: EditHouseholdPageProps) {
    const params = await props.params
    const household = await fetchHousehold(params.householdId)
    return (
        <div>
            <Header title={"Edit Household"}
                    subtitle={"Here can you edit your household."}
                    breadcrumbs={[
                        { url: "/households", label: "Households" },
                        { url: `/households/${household.id}`, label: household.name },
                        { label: "Edit" }
                    ]} />
            <Suspense fallback={<div>Loading...</div>}>
                <EditHousehold householdId={params.householdId} />
            </Suspense>
        </div>
    )
}
