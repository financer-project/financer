import { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { TransactionsList } from "./components/TransactionsList"
import { Button } from "@/src/lib/components/ui/button"
import { HouseholdProvider } from "@/src/lib/components/provider/HouseholdProvider"
import { TagProvider } from "@/src/lib/components/provider/TagProvider"
import { CirclePlus } from "lucide-react"
import {
    Page,
    PageActions,
    PageContent,
    PageDescription,
    PageHeader,
    PageTitle
} from "@/src/lib/components/content/page"
import { CounterpartyProvider } from "@/src/lib/components/provider/CounterpartyProvider"
import { CategoryProvider } from "@/src/lib/components/provider/CategoryProvider"

export const metadata: Metadata = {
    title: "Transactions",
    description: "List of transactions"
}

export default function TransactionsPage() {
    return (
        <Page>
            <PageHeader items={[{ label: "Transactions" }]}>
                <PageTitle>Transactions</PageTitle>
                <PageDescription>Here is a list of all transactions.</PageDescription>
                <PageActions>
                    <Button variant={"default"} asChild>
                        <Link href={"/transactions/new"}><CirclePlus />Create</Link>
                    </Button>
                </PageActions>
            </PageHeader>
            <PageContent>
                <Suspense fallback={<div>Loading...</div>}>
                    <HouseholdProvider>
                        <CategoryProvider>
                            <TagProvider>
                                <CounterpartyProvider>
                                    <TransactionsList />
                                </CounterpartyProvider>
                            </TagProvider>
                        </CategoryProvider>
                    </HouseholdProvider>
                </Suspense>
            </PageContent>
        </Page>
    )
}
