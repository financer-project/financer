import { Metadata } from "next"
import { Suspense } from "react"
import { invoke } from "@/src/app/blitz-server"
import getTag from "@/src/lib/model/tags/queries/getTag"
import { EditTag } from "@/src/app/(internal)/tags/components/EditTag"
import { TagProvider } from "@/src/lib/components/provider/TagProvider"
import { Page, PageContent, PageDescription, PageHeader, PageTitle } from "@/src/lib/components/content/page"

async function fetchTag(id: string) {
    return invoke(getTag, { id: id })
}

type EditTagPageProps = {
    params: Promise<{ tagId: string }>
}

export async function generateMetadata(props: EditTagPageProps): Promise<Metadata> {
    const params = await props.params
    const tag = await fetchTag(params.tagId)
    return {
        title: `Edit ${tag.name}`
    }
}

export default async function EditTagPage(props: Readonly<EditTagPageProps>) {
    const params = await props.params
    const tag = await fetchTag(params.tagId)

    return (
        <Page>
            <PageHeader items={[
                { label: "Tags", url: "/tags" },
                { label: tag.name, url: `/tags/${tag.id}` },
                { label: "Edit" }
            ]}>
                <PageTitle>Edit Tag</PageTitle>
                <PageDescription>Here can you edit your tag.</PageDescription>
            </PageHeader>
            <PageContent>
                <Suspense fallback={<div>Loading...</div>}>
                    <TagProvider>
                        <EditTag tagId={params.tagId} />
                    </TagProvider>
                </Suspense>
            </PageContent>
        </Page>
    )
}