import { Metadata } from "next"
import { Suspense } from "react"
import { invoke } from "@/src/app/blitz-server"
import getTag from "@/src/lib/model/tags/queries/getTag"
import { Tag } from "@/src/app/(internal)/tags/components/Tag"
import TagHeader from "@/src/app/(internal)/tags/[tagId]/header"
import { Page, PageContent } from "@/src/lib/components/content/page"

async function fetchTag(id: string) {
    return invoke(getTag, { id: id })
}

export async function generateMetadata(props: TagPageProps): Promise<Metadata> {
    const params = await props.params
    const tag = await fetchTag(params.tagId)
    return {
        title: `Tag ${tag.id} - ${tag.name}`
    }
}

type TagPageProps = {
    params: Promise<{ tagId: string }>
}

export default async function Page(props: Readonly<TagPageProps>) {
    const params = await props.params
    const tag = await fetchTag(params.tagId)

    return (
        <Page>
            <TagHeader tag={tag} />
            <PageContent>
                <Suspense fallback={<div>Loading...</div>}>
                    <Tag tagId={params.tagId} />
                </Suspense>
            </PageContent>
        </Page>
    )
}