import { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { TransactionsList } from "./components/TransactionsList"
import Header from "@/src/lib/components/content/nav/Header"
import { Button } from "@/src/lib/components/ui/button"
import { HouseholdProvider } from "@/src/lib/components/provider/HouseholdProvider"
import { TagProvider } from "@/src/lib/components/provider/TagProvider"

export const metadata: Metadata = {
    title: "Transactions",
    description: "List of transactions"
}

export default function Page() {
    return (
        <div>
            <Header title={"Transactions"}
                    subtitle={"Here is a list of all transactions."}
                    breadcrumbs={[{ label: "Transactions" }]}
                    actions={
                        <div>
                            <Button variant={"default"}
                                    asChild>
                                <Link href={"/transactions/new"}>New</Link>
                            </Button>
                        </div>
                    } />
            <Suspense fallback={<div>Loading...</div>}>
                <HouseholdProvider>
                    <TagProvider>
                        <TransactionsList />
                    </TagProvider>
                </HouseholdProvider>
            </Suspense>
        </div>
    )
}
