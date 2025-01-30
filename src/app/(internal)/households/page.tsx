import { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { HouseholdsList } from "./components/HouseholdsList"

export const metadata: Metadata = {
  title: "Households",
  description: "List of households",
}

export default function Page() {
  return (
    <div>
      <p>
        <Link href={"/households/new"}>Create Household</Link>
      </p>
      <Suspense fallback={<div>Loading...</div>}>
        <HouseholdsList />
      </Suspense>
    </div>
  )
}
