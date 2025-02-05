import { Metadata } from "next"
import { Suspense } from "react"
import { NewCategory } from "@/src/app/(internal)/categories/components/NewCategory"
import Header from "@/src/lib/components/content/nav/Header"
import { CategoryProvider } from "@/src/lib/components/provider/CategoryProvider"

export const metadata: Metadata = {
    title: "New Project",
    description: "Create a new project"
}

export default function Page() {
    return (
        <div>
            <Header title={"Create new Category"}
                    subtitle={"Here can you create a new category"}
                    breadcrumbs={[
                        { label: "Categories", url: "/categories" },
                        { label: "New" }
                    ]} />

            <Suspense fallback={<div>Loading...</div>}>
                <CategoryProvider>
                    <NewCategory />
                </CategoryProvider>
            </Suspense>
        </div>
    )
}
