import { Metadata } from "next"
import { Suspense } from "react"
import { NewCategory } from "@/src/app/(internal)/categories/components/NewCategory"
import { CategoryProvider } from "@/src/lib/components/provider/CategoryProvider"
import {
    Page,
    PageHeader,
    PageTitle,
    PageDescription,
    PageContent
} from "@/src/lib/components/content/page"

export const metadata: Metadata = {
    title: "New Category",
    description: "Create a new category"
}

export default function NewCategoryPage() {
    return (
        <Page>
            <PageHeader items={[
                { label: "Categories", url: "/categories" },
                { label: "New" }
            ]}>
                <PageTitle>Create new Category</PageTitle>
                <PageDescription>Here can you create a new category</PageDescription>
            </PageHeader>
            <PageContent>
                <Suspense fallback={<div>Loading...</div>}>
                    <CategoryProvider>
                        <NewCategory />
                    </CategoryProvider>
                </Suspense>
            </PageContent>
        </Page>
    )
}
