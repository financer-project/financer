import { Metadata } from "next"
import { Suspense } from "react"
import { New__ModelName } from "../components/NewAccount"
import Header from "@/src/lib/components/content/nav/Header"

export const metadata: Metadata = {
    title: "New Project",
    description: "Create a new project"
}

export default function Page() {
    return (
        <div>
            <Header title={"New Account"}
                    breadcrumbs={[
                        { label: "Households", url: "/households" },
                        { label: "Household", url: "/households/[householdId]" },
                        { label: "Accounts", url: "/accounts" },
                        { label: "New" }]} />
            <Suspense fallback={<div>Loading...</div>}>
                <New__ModelName />
            </Suspense>
        </div>
    )
}
