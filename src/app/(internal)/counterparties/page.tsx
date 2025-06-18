import { Metadata } from "next"
import { Suspense } from "react"
import { CounterpartiesList } from "./components/CounterpartiesList"
import Header from "@/src/lib/components/content/nav/Header"

export const metadata: Metadata = {
    title: "Counterparties",
    description: "List of counterparties"
}

export default function Page() {
    return (
        <div>
            <Header title={"Counterparties"}
                    breadcrumbs={[{ label: "Counterparties" }]} />
            <Suspense fallback={<div>Loading...</div>}>
                <CounterpartiesList />
            </Suspense>
        </div>
    )
}
