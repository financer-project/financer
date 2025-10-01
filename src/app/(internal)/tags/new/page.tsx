import { Metadata } from "next"
import { Suspense } from "react"
import { NewTag } from "@/src/app/(internal)/tags/components/NewTag"
import { TagProvider } from "@/src/lib/components/provider/TagProvider"
import {
    Page,
    PageHeader,
    PageTitle,
    PageDescription,
    PageContent
} from "@/src/lib/components/content/page"

export const metadata: Metadata = {
    title: "New Tag",
    description: "Create a new tag"
}

export default function Page() {
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