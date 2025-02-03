import { Metadata } from "next"
import { Suspense } from "react"
import { NewAccount } from "../components/NewAccount"
import Header from "@/src/lib/components/content/nav/Header"
import { invoke } from "@/src/app/blitz-server"
import getHousehold from "@/src/lib/model/household/queries/getHousehold"
import { HouseholdProvider } from "@/src/lib/components/provider/HouseholdProvider"

export async function generateMetadata(props: HouseholdPageProps): Promise<Metadata> {
    const params = await props.params
    const Household = await invoke(getHousehold, { id: String(params.householdId) })
    return {
        title: `Create new account for household ${Household.name}`
    }
}

type HouseholdPageProps = {
    params: Promise<{ householdId: string }>
}

export default async function Page(props: Readonly<HouseholdPageProps>) {
    const params = await props.params

    return (
        <div>
            <Header title={"New Account"}
                    breadcrumbs={[
                        { label: "Households", url: "/households" },
                        { label: "Household", url: "/households/[householdId]" },
                        { label: "Accounts", url: "/accounts" },
                        { label: "New" }]} />
            <Suspense fallback={<div>Loading...</div>}>
                <HouseholdProvider>
                    <NewAccount householdId={params.householdId} />
                </HouseholdProvider>

            </Suspense>
        </div>
    )
}
