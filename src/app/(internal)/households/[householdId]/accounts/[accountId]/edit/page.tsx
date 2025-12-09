import { Metadata } from "next"
import { Suspense } from "react"
import { invoke } from "src/app/blitz-server"
import getAccount, { AccountModel } from "@/src/lib/model/account/queries/getAccount"
import { EditAccount } from "../../components/EditAccount"
import { Page, PageContent, PageDescription, PageHeader, PageTitle } from "@/src/lib/components/content/page"
import { HouseholdProvider } from "@/src/lib/components/provider/HouseholdProvider"

async function fetchAccount(accountId: string): Promise<AccountModel> {
    return invoke(getAccount, { id: accountId })
}

type EditAccountPageProps = {
    params: Promise<{ accountId: string }>;
};

export async function generateMetadata(
    props: EditAccountPageProps
): Promise<Metadata> {
    const params = await props.params
    const account = await fetchAccount(params.accountId)
    return {
        title: `Edit Account ${account.id} - ${account.name}`
    }
}

export default async function EditAccountPage(props: Readonly<EditAccountPageProps>) {
    const params = await props.params
    const account = await fetchAccount(params.accountId)
    return (
        <Page>
            <PageHeader items={[
                { label: "Households", url: "/households" },
                { label: account.household.name, url: `/households/${account.householdId}` },
                { label: account.name, url: `/households/${account.householdId}/accounts/${account.id}` },
                { label: "Edit" }
            ]}>
                <PageTitle>Edit Account</PageTitle>
                <PageDescription>Here can you edit your account.</PageDescription>
            </PageHeader>
            <PageContent>
                <Suspense fallback={<div>Loading...</div>}>
                    <HouseholdProvider>
                        <EditAccount accountId={params.accountId} />
                    </HouseholdProvider>
                </Suspense>
            </PageContent>
        </Page>
    )
}
