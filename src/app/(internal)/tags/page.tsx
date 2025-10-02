import { TagsList } from "@/src/app/(internal)/tags/components/TagsList"
import { Metadata } from "next"
import { TagProvider } from "@/src/lib/components/provider/TagProvider"
import { Suspense } from "react"
import { Page, PageContent, PageDescription, PageHeader, PageTitle } from "@/src/lib/components/content/page"

export const metadata: Metadata = {
    title: "Tags",
    description: "List of tags"
}

export default function TagsPage() {
    return (
        <Page>
            <PageHeader items={[{ label: "Tags" }]}>
                <PageTitle>Tags</PageTitle>
                <PageDescription>Here you can find all your tags.</PageDescription>
            </PageHeader>
            <PageContent>
                <Suspense fallback={<div>Loading...</div>}>
                    <TagProvider>
                        <TagsList />
                    </TagProvider>
                </Suspense>
            </PageContent>
        </Page>
    )
}