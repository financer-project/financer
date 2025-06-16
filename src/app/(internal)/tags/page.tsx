import { TagsList } from "@/src/app/(internal)/tags/components/TagsList"
import { Metadata } from "next"
import Header from "@/src/lib/components/content/nav/Header"
import { TagProvider } from "@/src/lib/components/provider/TagProvider"
import { Suspense } from "react"

export const metadata: Metadata = {
    title: "Tags",
    description: "List of tags"
}

export default function TagsPage() {
    return (
        <>
            <Header title={"Tags"}
                    subtitle={"Here you can find all your tags."}
                    breadcrumbs={[
                        { label: "Tags" }
                    ]}
            />
            <Suspense fallback={<div>Loading...</div>}>
                <TagProvider>
                    <TagsList />
                </TagProvider>
            </Suspense>
        </>
    )
}