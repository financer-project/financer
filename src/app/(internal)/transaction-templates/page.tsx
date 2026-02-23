import { Metadata } from "next"
import { Suspense } from "react"
import { TransactionTemplateList } from "./components/TransactionTemplateList"
import { SuggestedTemplateList } from "./components/SuggestedTemplateList"
import { Page, PageContent, PageDescription, PageHeader, PageTitle } from "@/src/lib/components/content/page"
import { AccountProvider } from "@/src/lib/components/provider/AccountProvider"
import { CategoryProvider } from "@/src/lib/components/provider/CategoryProvider"
import { CounterpartyProvider } from "@/src/lib/components/provider/CounterpartyProvider"
import { TagProvider } from "@/src/lib/components/provider/TagProvider"
import Section from "@/src/lib/components/common/structure/Section"

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
                <AccountProvider>
                    <CategoryProvider>
                        <CounterpartyProvider>
                            <TagProvider>
                                <Suspense fallback={<div>Loading suggestions...</div>}>
                                    <SuggestedTemplateList />
                                </Suspense>
                                <Section
                                    title="Templates"
                                    subtitle={"Find all your transaction templates"}>
                                    <Suspense fallback={<div>Loading...</div>}>
                                        <TransactionTemplateList />
                                    </Suspense>
                                </Section>
                            </TagProvider>
                        </CounterpartyProvider>
                    </CategoryProvider>
                </AccountProvider>
            </PageContent>
        </Page>
    )
}
