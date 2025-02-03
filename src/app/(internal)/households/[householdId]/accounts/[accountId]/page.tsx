import { Metadata } from "next"
import { Suspense } from "react"
import { invoke } from "src/app/blitz-server"
import getAccount from "@/src/lib/model/account/queries/getAccount"
import { Account } from "../components/Account"
import Header from "@/src/lib/components/content/nav/Header"

export async function generateMetadata(
    props: AccountPageProps
): Promise<Metadata> {
    const params = await props.params
    const Account = await invoke(getAccount, { id: String(params.accountId) })
    return {
        title: `Account ${Account.id} - ${Account.name}`
    }
}

type AccountPageProps = {
    params: Promise<{ accountId: string }>;
};

export default async function Page(props: AccountPageProps) {
    const params = await props.params
    return (
        <div>
            <Header title={"Account Details"}
                    subtitle={"Here can you edit, delete and view the household details."}
                    breadcrumbs={[
                        { label: "Households", url: "/households" },
                        { label: "Household", url: "/households" },
                        { label: props.params.accountId }
                    ]} />
            <Suspense fallback={<div>Loading...</div>}>
                <Account accountId={params.accountId} />
            </Suspense>
        </div>
    )
}
