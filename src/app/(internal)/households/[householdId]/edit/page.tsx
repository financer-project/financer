import { Metadata } from "next"
import { Suspense } from "react"
import { invoke } from "src/app/blitz-server"
import getHousehold from "@/src/lib/model/household/queries/getHousehold"
import { EditHousehold } from "../../components/EditHousehold"

type EditHouseholdPageProps = {
  params: Promise<{ householdId: string }>
}

export async function generateMetadata(props: EditHouseholdPageProps): Promise<Metadata> {
  const params = await props.params
  const Household = await invoke(getHousehold, {
    id: Number(params.householdId),
  })
  return {
    title: `Edit Household ${Household.id} - ${Household.name}`,
  }
}

export default async function Page(props: EditHouseholdPageProps) {
  const params = await props.params
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <EditHousehold householdId={Number(params.householdId)} />
      </Suspense>
    </div>
  )
}
