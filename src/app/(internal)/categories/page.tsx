import { Metadata } from "next"
import { Suspense } from "react"
import { CategoriesList } from "@/src/app/(internal)/categories/components/CategoriesList"
import { CategoryProvider } from "@/src/lib/components/provider/CategoryProvider"
import {
    Page,
    PageHeader,
    PageTitle,
    PageDescription,
    PageContent
} from "@/src/lib/components/content/page"

export const metadata: Metadata = {
    title: "Categories",
    description: "List of categories"
}

export default function CategoriesPage() {
    return (
        <Page>
            <PageHeader items={[{ label: "Categories" }]}>
                <PageTitle>Categories</PageTitle>
                <PageDescription>Here can you find all your categories.</PageDescription>
            </PageHeader>
            <PageContent>
                <Suspense fallback={<div>Loading...</div>}>
                    <CategoryProvider>
                        <CategoriesList />
                    </CategoryProvider>
                </Suspense>
            </PageContent>
        </Page>
    )
}
