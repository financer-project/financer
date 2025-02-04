import { Metadata } from "next"
import { Suspense } from "react"
import { invoke } from "src/app/blitz-server"
import getAccount, { AccountModel } from "@/src/lib/model/account/queries/getAccount"
import Header from "@/src/lib/components/content/nav/Header"
import { Account } from "@/src/app/(internal)/households/[householdId]/accounts/components/Account"

async function fetchAccount(accountId: string): Promise<AccountModel> {
    return await invoke(getAccount, { id: accountId })
}

export async function generateMetadata(props: AccountPageProps): Promise<Metadata> {
    const params = await props.params
    const account = await fetchAccount(params.accountId)
    return {
        title: `Account ${account.id} - ${account.name}`
    }
}

type AccountPageProps = {
    params: Promise<{ accountId: string }>;
};

export default async function Page(props: AccountPageProps) {
    const params = await props.params
    const account = await fetchAccount(params.accountId)

    return (
        <div>
            <Header title={"Account Details"}
                    subtitle={"Here can you edit, delete and view the household details."}
                    breadcrumbs={[
                        { label: "Households", url: "/households" },
                        { label: account.household.name, url: `/households/${account.householdId}` },
                        { label: account.name }
                    ]} />
            <Suspense fallback={<div>Loading...</div>}>
                <Account accountId={params.accountId} />
            </Suspense>
        </div>
    )
}
