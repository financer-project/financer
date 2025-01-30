import { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { invoke } from "src/app/blitz-server"
import getHousehold from "../queries/getHousehold"
import { Household } from "../components/Household"

export async function generateMetadata(props: HouseholdPageProps): Promise<Metadata> {
  const params = await props.params
  const Household = await invoke(getHousehold, {
    id: Number(params.householdId),
  })
  return {
    title: `Household ${Household.id} - ${Household.name}`,
  }
}

type HouseholdPageProps = {
  params: Promise<{ householdId: string }>
}

export default async function Page(props: HouseholdPageProps) {
  const params = await props.params
  return (
    <div>
      <p>
        <Link href={"/households"}>Households</Link>
      </p>
      <Suspense fallback={<div>Loading...</div>}>
        <Household householdId={Number(params.householdId)} />
      </Suspense>
    </div>
  )
}
