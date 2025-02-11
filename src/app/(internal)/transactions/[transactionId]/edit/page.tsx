import { Metadata } from "next"
import { Suspense } from "react"
import { invoke } from "@/src/app/blitz-server"
import getTransaction from "@/src/lib/model/transactions/queries/getTransaction"
import { EditTransaction } from "../../components/EditTransaction"
import { AccountProvider } from "@/src/lib/components/provider/AccountProvider"
import { CategoryProvider } from "@/src/lib/components/provider/CategoryProvider"

type EditTransactionPageProps = {
    params: Promise<{ transactionId: string }>
}

export async function generateMetadata(props: EditTransactionPageProps): Promise<Metadata> {
    const params = await props.params
    const Transaction = await invoke(getTransaction, { id: params.transactionId })
    return {
        title: `Edit Transaction ${Transaction.id} - ${Transaction.name}`
    }
}

export default async function Page(props: Readonly<EditTransactionPageProps>) {
    const params = await props.params
    return (
        <div>
            <Suspense fallback={<div>Loading...</div>}>
                <AccountProvider>
                    <CategoryProvider>
                        <EditTransaction transactionId={params.transactionId} />
                    </CategoryProvider>
                </AccountProvider>
            </Suspense>
        </div>
    )
}
