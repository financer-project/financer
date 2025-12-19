import { Metadata } from "next"
import { Suspense } from "react"
import { NewTag } from "@/src/app/(internal)/tags/components/NewTag"
import { TagProvider } from "@/src/lib/components/provider/TagProvider"
import { Page, PageContent, PageDescription, PageHeader, PageTitle } from "@/src/lib/components/content/page"
import { invoke } from "@/src/app/blitz-server"
import authorizeAbility from "@/src/lib/guard/queries/authorizeAbility"
import { Prisma } from "@prisma/client"
import getCurrentHousehold from "@/src/lib/model/household/queries/getCurrentHousehold"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
    title: "New Tag",
    description: "Create a new tag"
}

export default async function NewTagPage() {
    const allowed = await invoke(authorizeAbility, {
        action: "create",
        resource: Prisma.ModelName.Tag,
        useCurrentHousehold: true
    })
    if (!allowed) {
        redirect("/tags")
    }
    return (
        <Page>
            <PageHeader items={[
                { label: "Tags", url: "/tags" },
                { label: "New" }
            ]}>
                <PageTitle>Create new Tag</PageTitle>
                <PageDescription>Here can you create a new tag</PageDescription>
            </PageHeader>
            <PageContent>
                <Suspense fallback={<div>Loading...</div>}>
                    <TagProvider>
                        <NewTag />
                    </TagProvider>
                </Suspense>
            </PageContent>
        </Page>
    )
}