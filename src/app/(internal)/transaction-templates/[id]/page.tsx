import { Metadata } from "next"
import { Suspense } from "react"
import { invoke } from "@/src/app/blitz-server"
import getTransactionTemplate from "@/src/lib/model/transactionTemplates/queries/getTransactionTemplate"
import { TransactionTemplate } from "@/src/app/(internal)/transaction-templates/components/TransactionTemplate"
import TransactionTemplateHeader from "@/src/app/(internal)/transaction-templates/[id]/header"
import { Page, PageContent } from "@/src/lib/components/content/page"
import { AccountProvider } from "@/src/lib/components/provider/AccountProvider"
import { CategoryProvider } from "@/src/lib/components/provider/CategoryProvider"
import { CounterpartyProvider } from "@/src/lib/components/provider/CounterpartyProvider"
import { TagProvider } from "@/src/lib/components/provider/TagProvider"

async function fetchTemplate(id: string) {
    return invoke(getTransactionTemplate, { id })
}

type TransactionTemplatePageProps = {
    params: Promise<{ id: string }>
}

export async function generateMetadata(props: TransactionTemplatePageProps): Promise<Metadata> {
    const params = await props.params
    const template = await fetchTemplate(params.id)
    return { title: `Transaction Template - ${template.name}` }
}

export default async function TransactionTemplatePage(props: Readonly<TransactionTemplatePageProps>) {
    const params = await props.params
    const template = await fetchTemplate(params.id)

    return (
        <Page>
            <TransactionTemplateHeader template={template} />
            <PageContent>
                <AccountProvider>
                    <CategoryProvider>
                        <CounterpartyProvider>
                            <TagProvider>
                                <Suspense fallback={<div>Loading...</div>}>
                                    <TransactionTemplate templateId={params.id} />
                                </Suspense>
                            </TagProvider>
                        </CounterpartyProvider>
                    </CategoryProvider>
                </AccountProvider>
            </PageContent>
        </Page>
    )
}
