import { Metadata } from "next"
import { Suspense } from "react"
import { NewTag } from "@/src/app/(internal)/tags/components/NewTag"
import Header from "@/src/lib/components/content/nav/Header"
import { TagProvider } from "@/src/lib/components/provider/TagProvider"

export const metadata: Metadata = {
    title: "New Tag",
    description: "Create a new tag"
}

export default function Page() {
    return (
        <div>
            <Header title={"Create new Tag"}
                    subtitle={"Here can you create a new tag"}
                    breadcrumbs={[
                        { label: "Tags", url: "/tags" },
                        { label: "New" }
                    ]} />

            <Suspense fallback={<div>Loading...</div>}>
                <TagProvider>
                    <NewTag />
                </TagProvider>
            </Suspense>
        </div>
    )
}