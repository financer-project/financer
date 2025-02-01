import { Metadata } from "next"
import { Suspense } from "react"
import { HouseholdsList } from "./components/HouseholdsList"
import Header from "@/src/lib/components/content/nav/Header"
import { Button } from "@/src/lib/components/ui/button"
import { SquarePenIcon, Trash2Icon } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
    title: "Households",
    description: "List of households"
}

export default function Page() {
    return (
        <div>
            <Header title={"Households"}
                    subtitle={"Here is a list of all households."}
                    breadcrumbs={[{ label: "Households", url: "/households" }]} />
            <Suspense fallback={<div>Loading...</div>}>
                <HouseholdsList />
            </Suspense>
        </div>
    )
}
