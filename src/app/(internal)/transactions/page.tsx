import { Metadata } from "next"
import { Suspense } from "react"
import { TransactionsList } from "./components/TransactionsList"
import { TagProvider } from "@/src/lib/components/provider/TagProvider"
import { Page, PageContent, PageDescription, PageHeader, PageTitle } from "@/src/lib/components/content/page"
import { CounterpartyProvider } from "@/src/lib/components/provider/CounterpartyProvider"
import { CategoryProvider } from "@/src/lib/components/provider/CategoryProvider"
import { AccountProvider } from "@/src/lib/components/provider/AccountProvider"

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
            </PageHeader>
            <PageContent>
                <Suspense fallback={<div>Loading...</div>}>
                    <AccountProvider>
                        <CategoryProvider>
                            <TagProvider>
                                <CounterpartyProvider>
                                    <TransactionsList />
                                </CounterpartyProvider>
                            </TagProvider>
                        </CategoryProvider>
                    </AccountProvider>
                </Suspense>
            </PageContent>
        </Page>
    )
}
