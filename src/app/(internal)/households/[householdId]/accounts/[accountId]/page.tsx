import { Metadata } from "next"
import { Suspense } from "react"
import { invoke } from "src/app/blitz-server"
import getAccount, { AccountModel } from "@/src/lib/model/account/queries/getAccount"
import { Account } from "@/src/app/(internal)/households/[householdId]/accounts/components/Account"
import AccountHeader from "@/src/app/(internal)/households/[householdId]/accounts/[accountId]/header"
import { Page, PageContent } from "@/src/lib/components/content/page"

async function fetchAccount(accountId: string): Promise<AccountModel> {
    return invoke(getAccount, { id: accountId })
}

export async function generateMetadata(props: AccountPageProps): Promise<Metadata> {
    const params = await props.params
    const account = await fetchAccount(params.accountId)
    return {
        title: account.name
    }
}

type AccountPageProps = {
    params: Promise<{ accountId: string }>;
};

export default async function AccountDetailsPage(props: Readonly<AccountPageProps>) {


    const params = await props.params
    const account = await fetchAccount(params.accountId)

    return (
        <Page>
            <AccountHeader account={account} />
            <PageContent>
                <Suspense fallback={<div>Loading...</div>}>
                    <Account accountId={params.accountId} />
                </Suspense>
            </PageContent>
        </Page>
    )
}
