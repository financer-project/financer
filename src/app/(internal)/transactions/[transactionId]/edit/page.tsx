import { Metadata } from "next"
import { Suspense } from "react"
import { invoke } from "@/src/app/blitz-server"
import getTransaction from "@/src/lib/model/transactions/queries/getTransaction"
import { EditTransaction } from "../../components/EditTransaction"
import { AccountProvider } from "@/src/lib/components/provider/AccountProvider"
import { CategoryProvider } from "@/src/lib/components/provider/CategoryProvider"
import { TagProvider } from "@/src/lib/components/provider/TagProvider"
import { CounterpartyProvider } from "@/src/lib/components/provider/CounterpartyProvider"
import { Page } from "@/src/lib/components/content/page"
import authorizeAbility from "@/src/lib/guard/queries/authorizeAbility"
import { Prisma } from "@prisma/client"
import { redirect } from "next/navigation"

type EditTransactionPageProps = {
    params: Promise<{ transactionId: string }>
}

export async function generateMetadata(props: EditTransactionPageProps): Promise<Metadata> {
    const params = await props.params
    const Transaction = await invoke(getTransaction, { id: params.transactionId })
    return {
        title: `Edit ${Transaction.name ?? Transaction.category?.name ?? "Transaction"}`
    }
}

export default async function EditTransactionPage(props: Readonly<EditTransactionPageProps>) {
    const params = await props.params
    const allowed = await invoke(authorizeAbility, {
        action: "update",
        resource: Prisma.ModelName.Transaction,
        params: { id: params.transactionId }
    })

    if (!allowed) {
        redirect(`/transactions/${params.transactionId}`)
    }
    return (
        <Page>
            <Suspense fallback={<div>Loading...</div>}>
                <AccountProvider>
                    <CategoryProvider>
                        <TagProvider>
                            <CounterpartyProvider>
                                <EditTransaction transactionId={params.transactionId} />
                            </CounterpartyProvider>
                        </TagProvider>
                    </CategoryProvider>
                </AccountProvider>
            </Suspense>
        </Page>
    )
}
