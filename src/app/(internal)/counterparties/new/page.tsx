import { Metadata } from "next"
import { Suspense } from "react"
import { NewCounterparty } from "@/src/app/(internal)/counterparties/components/NewCounterparty"
import Header from "@/src/lib/components/content/nav/Header"

export const metadata: Metadata = {
    title: "New Counterparty",
    description: "Create a new counterparty"
}

export default function Page() {
    return (
        <div>
            <Header title={"Create new Counterparty"}
                    subtitle={"Here you can create a new counterparty"}
                    breadcrumbs={[
                        { label: "Counterparties", url: "/counterparties" },
                        { label: "New" }
                    ]} />

            <Suspense fallback={<div>Loading...</div>}>
                <NewCounterparty />
            </Suspense>
        </div>
    )
}