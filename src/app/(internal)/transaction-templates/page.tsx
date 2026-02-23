import { Metadata } from "next"
import { Suspense } from "react"
import { TransactionTemplateList } from "./components/TransactionTemplateList"
import { Page, PageContent, PageDescription, PageHeader, PageTitle } from "@/src/lib/components/content/page"
import { AccountProvider } from "@/src/lib/components/provider/AccountProvider"
import { CategoryProvider } from "@/src/lib/components/provider/CategoryProvider"
import { CounterpartyProvider } from "@/src/lib/components/provider/CounterpartyProvider"

export const metadata: Metadata = {
    title: "Transaction Templates",
    description: "Manage recurring transaction templates"
}

export default function TransactionTemplatesPage() {
    return (
        <Page>
            <PageHeader items={[{ label: "Transaction Templates" }]}>
                <PageTitle>Transaction Templates</PageTitle>
                <PageDescription>Manage your recurring transaction templates.</PageDescription>
            </PageHeader>
            <PageContent>
                <Suspense fallback={<div>Loading...</div>}>
                    <AccountProvider>
                        <CategoryProvider>
                            <CounterpartyProvider>
                                <TransactionTemplateList />
                            </CounterpartyProvider>
                        </CategoryProvider>
                    </AccountProvider>
                </Suspense>
            </PageContent>
        </Page>
    )
}
