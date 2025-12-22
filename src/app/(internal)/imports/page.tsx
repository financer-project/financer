import { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import {
    Page,
    PageActions,
    PageContent,
    PageDescription,
    PageHeader,
    PageTitle
} from "@/src/lib/components/content/page"
import { Button } from "@/src/lib/components/ui/button"
import { ImportJobsList } from "./components/ImportJobsList"
import { invoke } from "@/src/app/blitz-server"
import authorizeAbility from "@/src/lib/guard/queries/authorizeAbility"
import { Prisma } from "@prisma/client"

export const metadata: Metadata = {
    title: "Import Transactions",
    description: "Import transactions from CSV files"
}

export default async function ImportListPage() {
    const canCreateImport = await invoke(authorizeAbility, {
        action: "create",
        resource: Prisma.ModelName.ImportJob,
        useCurrentHousehold: true
    })
    return (
        <Page>
            <PageHeader items={[{ label: "Imports" }]}>
                <PageTitle>Import Transactions</PageTitle>
                <PageDescription>Import your transactions from CSV files.</PageDescription>
                <PageActions>
                    {canCreateImport && (
                        <Button variant={"default"} asChild>
                            <Link href={"/imports/new"}>New Import</Link>
                        </Button>
                    )}
                </PageActions>
            </PageHeader>
            <PageContent>
                <Suspense fallback={<div>Loading...</div>}>
                    <ImportJobsList />
                </Suspense>
            </PageContent>
        </Page>
    )
}
