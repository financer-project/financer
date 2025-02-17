import { Metadata } from "next"
import { Suspense } from "react"
import { invoke } from "@/src/app/blitz-server"
import getCategory from "@/src/lib/model/categories/queries/getCategory"
import { EditCategory } from "@/src/app/(internal)/categories/components/EditCategory"
import { CategoryProvider } from "@/src/lib/components/provider/CategoryProvider"
import Header from "@/src/lib/components/content/nav/Header"

async function fetchCategory(id: string) {
    return invoke(getCategory, { id: id })
}

type EditCategoryPageProps = {
    params: Promise<{ categoryId: string }>
}

export async function generateMetadata(props: EditCategoryPageProps): Promise<Metadata> {
    const params = await props.params
    const category = await fetchCategory(params.categoryId)
    return {
        title: `Edit Category ${category.id} - ${category.name}`
    }
}

export default async function Page(props: EditCategoryPageProps) {
    const params = await props.params
    const category = await fetchCategory(params.categoryId)

    return (
        <div>
            <Header title={"Edit Category"}
                    subtitle={"Here can you edit your category."}
                    breadcrumbs={[
                        { label: "Categories", url: "/categories" },
                        { label: category.name, url: `/categories/${category.id}` },
                        { label: "Edit" }
                    ]} />
            <Suspense fallback={<div>Loading...</div>}>
                <CategoryProvider>
                    <EditCategory categoryId={params.categoryId} />
                </CategoryProvider>
            </Suspense>
        </div>
    )
}
