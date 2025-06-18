import { Metadata } from "next"
import { Suspense } from "react"
import { NewTransaction } from "../components/NewTransaction"
import { CategoryProvider } from "@/src/lib/components/provider/CategoryProvider"
import { AccountProvider } from "@/src/lib/components/provider/AccountProvider"
import { TagProvider } from "@/src/lib/components/provider/TagProvider"
import { CounterpartyProvider } from "@/src/lib/components/provider/CounterpartyProvider"
import Header from "@/src/lib/components/content/nav/Header"

export const metadata: Metadata = {
    title: "New Project",
    description: "Create a new project"
}

export default function Page() {
    return (
        <div>
            <Header title={"Create new Transaction"}
                    subtitle={"Here can you create a new transaction"}
                    breadcrumbs={[
                        { label: "Transactions", url: "/transactions" },
                        { label: "New" }
                    ]} />
            <Suspense fallback={<div>Loading...</div>}>
                <AccountProvider>
                    <CategoryProvider>
                        <TagProvider>
                            <CounterpartyProvider>
                                <NewTransaction />
                            </CounterpartyProvider>
                        </TagProvider>
                    </CategoryProvider>
                </AccountProvider>
            </Suspense>
        </div>
    )
}
