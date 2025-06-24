import { Metadata } from "next"
import { Suspense } from "react"
import { invoke } from "@/src/app/blitz-server"
import getCounterparty from "@/src/lib/model/counterparties/queries/getCounterparty"
import { EditCounterparty } from "@/src/app/(internal)/counterparties/components/EditCounterparty"
import Header from "@/src/lib/components/content/nav/Header"

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
        title: `Edit Counterparty ${counterparty.id} - ${counterparty.name}`
    }
}

export default async function Page(props: Readonly<EditCounterpartyPageProps>) {
    const params = await props.params
    const counterparty = await fetchCounterparty(params.counterpartyId)

    return (
        <div>
            <Header title={"Edit Counterparty"}
                    subtitle={"Here you can edit your counterparty."}
                    breadcrumbs={[
                        { label: "Counterparties", url: "/counterparties" },
                        { label: counterparty.name, url: `/counterparties/${counterparty.id}` },
                        { label: "Edit" }
                    ]} />
            <Suspense fallback={<div>Loading...</div>}>
                <EditCounterparty counterpartyId={params.counterpartyId} />
            </Suspense>
        </div>
    )
}