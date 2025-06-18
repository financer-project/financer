import { Metadata } from "next"
import { Suspense } from "react"
import { invoke } from "@/src/app/blitz-server"
import getTransaction, { TransactionModel } from "@/src/lib/model/transactions/queries/getTransaction"
import { Transaction } from "../components/Transaction"
import TransactionHeader from "@/src/app/(internal)/transactions/[transactionId]/header"
import { TagProvider } from "@/src/lib/components/provider/TagProvider"
import { CounterpartyProvider } from "@/src/lib/components/provider/CounterpartyProvider"

async function fetchTransaction(id: string): Promise<TransactionModel> {
    return invoke(getTransaction, { id: id })
}

export async function generateMetadata(props: TransactionPageProps): Promise<Metadata> {
    const params = await props.params
    const transaction = await fetchTransaction(params.transactionId)
    return {
        title: `Transaction ${transaction.id} - ${transaction.name}`
    }
}

type TransactionPageProps = {
    params: Promise<{ transactionId: string }>
}

export default async function Page(props: Readonly<TransactionPageProps>) {
    const params = await props.params
    const transaction = await fetchTransaction(params.transactionId)

    return (
        <div>
            <TransactionHeader transaction={transaction} />
            <Suspense fallback={<div>Loading...</div>}>
                <TagProvider>
                    <CounterpartyProvider>
                        <Transaction transactionId={transaction.id} />
                    </CounterpartyProvider>
                </TagProvider>
            </Suspense>
        </div>
    )
}
