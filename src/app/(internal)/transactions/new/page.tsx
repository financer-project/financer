import { Metadata } from "next"
import { Suspense } from "react"
import { NewTransaction } from "../components/NewTransaction"
import { CategoryProvider } from "@/src/lib/components/provider/CategoryProvider"
import { AccountProvider } from "@/src/lib/components/provider/AccountProvider"
import { TagProvider } from "@/src/lib/components/provider/TagProvider"
import { CounterpartyProvider } from "@/src/lib/components/provider/CounterpartyProvider"
import { Page, PageContent, PageDescription, PageHeader, PageTitle } from "@/src/lib/components/content/page"
import { invoke } from "@/src/app/blitz-server"
import authorizeAbility from "@/src/lib/guard/queries/authorizeAbility"
import { Prisma } from "@prisma/client"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
    title: "New Transaction",
    description: "Create a new transaction"
}

export default async function NewTransactionPage() {
    const allowed = await invoke(authorizeAbility, {
        action: "create",
        resource: Prisma.ModelName.Transaction,
        useCurrentHousehold: true
    })

    if (!allowed) {
        redirect("/transactions")
    }

    return (
        <Page>
            <PageHeader items={[
                { label: "Transactions", url: "/transactions" },
                { label: "New" }
            ]}>
                <PageTitle>Create new Transaction</PageTitle>
                <PageDescription>Here can you create a new transaction</PageDescription>
            </PageHeader>
            <PageContent>
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
            </PageContent>
        </Page>
    )
}
