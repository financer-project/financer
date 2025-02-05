import { Metadata } from "next"
import { Suspense } from "react"
import { CategoriesList } from "@/src/app/(internal)/categories/components/CategoriesList"
import Header from "@/src/lib/components/content/nav/Header"
import { CategoryProvider } from "@/src/lib/components/provider/CategoryProvider"

export const metadata: Metadata = {
    title: "Categories",
    description: "List of categories"
}

export default function Page() {
    return (
        <div>
            <Header title={"Categories"}
                    subtitle={"Here can you find all your categories."}
                    breadcrumbs={[
                        { label: "Categories" }
                    ]} />
            <Suspense fallback={<div>Loading...</div>}>
                <CategoryProvider>
                    <CategoriesList />
                </CategoryProvider>
            </Suspense>
        </div>
    )
}
