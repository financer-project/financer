import { Metadata } from "next"
import { Suspense } from "react"
import { invoke } from "src/app/blitz-server"
import getHousehold from "@/src/lib/model/household/queries/getHousehold"
import { EditHousehold } from "../../components/EditHousehold"
import {
    Page ,
    PageHeader,
    PageTitle,
    PageDescription,
    PageContent
} from "@/src/lib/components/content/page"
import { Household as HouseholdModel } from ".prisma/client"

async function fetchHousehold(householdId: string): Promise<HouseholdModel> {
    return invoke(getHousehold, { id: householdId })
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

export default async function EditHouseholdPage(props: Readonly<EditHouseholdPageProps>) {
    const params = await props.params
    const household = await fetchHousehold(params.householdId)
    return (
        <Page>
            <PageHeader items={[
                { url: "/households", label: "Households" },
                { url: `/households/${household.id}`, label: household.name },
                { label: "Edit" }
            ]}>
                <PageTitle>Edit Household</PageTitle>
                <PageDescription>Here can you edit your household.</PageDescription>
            </PageHeader>
            <PageContent>
                <Suspense fallback={<div>Loading...</div>}>
                    <EditHousehold householdId={params.householdId} />
                </Suspense>
            </PageContent>
        </Page>
    )
}
