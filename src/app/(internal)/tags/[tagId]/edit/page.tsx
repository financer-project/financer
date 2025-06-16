import { Metadata } from "next"
import { Suspense } from "react"
import { invoke } from "@/src/app/blitz-server"
import getTag from "@/src/lib/model/tags/queries/getTag"
import { EditTag } from "@/src/app/(internal)/tags/components/EditTag"
import { TagProvider } from "@/src/lib/components/provider/TagProvider"
import Header from "@/src/lib/components/content/nav/Header"

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
        title: `Edit Tag ${tag.id} - ${tag.name}`
    }
}

export default async function Page(props: Readonly<EditTagPageProps>) {
    const params = await props.params
    const tag = await fetchTag(params.tagId)

    return (
        <div>
            <Header title={"Edit Tag"}
                    subtitle={"Here can you edit your tag."}
                    breadcrumbs={[
                        { label: "Tags", url: "/tags" },
                        { label: tag.name, url: `/tags/${tag.id}` },
                        { label: "Edit" }
                    ]} />
            <Suspense fallback={<div>Loading...</div>}>
                <TagProvider>
                    <EditTag tagId={params.tagId} />
                </TagProvider>
            </Suspense>
        </div>
    )
}