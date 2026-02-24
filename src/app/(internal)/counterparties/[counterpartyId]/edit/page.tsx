import { Metadata } from "next"
import { Suspense } from "react"
import { invoke } from "@/src/app/blitz-server"
import getCounterparty from "@/src/lib/model/counterparties/queries/getCounterparty"
import { EditCounterparty } from "@/src/app/(internal)/counterparties/components/EditCounterparty"
import { Page, PageContent, PageDescription, PageHeader, PageTitle } from "@/src/lib/components/content/page"

async function fetchCounterparty(id: string) {
    return invoke(getCounterparty, { id: id })
}

type EditCounterpartyPageProps = {
    params: Promise<{ counterpartyId: string }>
}

export async function generateMetadata(props: EditCounterpartyPageProps): Promise<Metadata> {
    const params = await props.params
    const counterparty = await fetchCounterparty(params.counterpartyId)
    return {
        title: `Edit ${counterparty.name}`
    }
}

export default async function EditCounterpartyPage(props: Readonly<EditCounterpartyPageProps>) {
    const params = await props.params
    const counterparty = await fetchCounterparty(params.counterpartyId)

    return (
        <Page>
            <PageHeader items={[
                { label: "Counterparties", url: "/counterparties" },
                { label: counterparty.name, url: `/counterparties/${counterparty.id}` },
                { label: "Edit" }
            ]}>
                <PageTitle>Edit Counterparty</PageTitle>
                <PageDescription>Here can you edit your counterparty.</PageDescription>
            </PageHeader>
            <PageContent>
                <Suspense fallback={<div>Loading...</div>}>
                    <EditCounterparty counterpartyId={params.counterpartyId} />
                </Suspense>
            </PageContent>
        </Page>
    )
}