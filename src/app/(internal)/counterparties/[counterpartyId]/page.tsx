import { Metadata } from "next"
import { Suspense } from "react"
import { invoke } from "@/src/app/blitz-server"
import getCounterparty from "@/src/lib/model/counterparties/queries/getCounterparty"
import { Counterparty } from "@/src/app/(internal)/counterparties/components/Counterparty"
import CounterpartyHeader from "@/src/app/(internal)/counterparties/[counterpartyId]/header"
import { Page, PageContent } from "@/src/lib/components/content/page"

async function fetchCounterparty(id: string) {
    return invoke(getCounterparty, { id: id })
}

type CounterpartyPageProps = {
    params: Promise<{ counterpartyId: string }>
}

export async function generateMetadata(props: CounterpartyPageProps): Promise<Metadata> {
    const params = await props.params
    const counterparty = await fetchCounterparty(params.counterpartyId)
    return {
        title: `Counterparty ${counterparty.id} - ${counterparty.name}`
    }
}

export default async function CounterpartyPage(props: Readonly<CounterpartyPageProps>) {
    const params = await props.params
    const counterparty = await fetchCounterparty(params.counterpartyId)

    return (
        <Page>
            <CounterpartyHeader counterparty={counterparty} />
            <PageContent>
                <Suspense fallback={<div>Loading...</div>}>
                    <Counterparty counterpartyId={params.counterpartyId} />
                </Suspense>
            </PageContent>
        </Page>
    )
}