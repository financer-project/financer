import { Metadata } from "next"
import { Suspense } from "react"
import { invoke } from "@/src/app/blitz-server"
import getTransactionTemplate from "@/src/lib/model/transactionTemplates/queries/getTransactionTemplate"
import { EditTransactionTemplate } from "@/src/app/(internal)/transaction-templates/components/EditTransactionTemplate"
import { Page, PageContent, PageDescription, PageHeader, PageTitle } from "@/src/lib/components/content/page"

type EditTransactionTemplatePageProps = {
    params: Promise<{ id: string }>
}

export async function generateMetadata(props: EditTransactionTemplatePageProps): Promise<Metadata> {
    const params = await props.params
    const template = await invoke(getTransactionTemplate, { id: params.id })
    return { title: `Edit Template - ${template.name}` }
}

export default async function EditTransactionTemplatePage(props: Readonly<EditTransactionTemplatePageProps>) {
    const params = await props.params
    const template = await invoke(getTransactionTemplate, { id: params.id })

    return (
        <Page>
            <PageHeader items={[
                { label: "Transaction Templates", url: "/transaction-templates" },
                { label: template.name, url: `/transaction-templates/${params.id}` },
                { label: "Edit" }
            ]}>
                <PageTitle>Edit Transaction Template</PageTitle>
                <PageDescription>Update the recurring transaction template.</PageDescription>
            </PageHeader>
            <PageContent>
                <Suspense fallback={<div>Loading...</div>}>
                    <EditTransactionTemplate templateId={params.id} />
                </Suspense>
            </PageContent>
        </Page>
    )
}
