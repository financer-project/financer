import { Metadata } from "next"
import { Suspense } from "react"
import { invoke } from "@/src/app/blitz-server"
import getCategory from "@/src/lib/model/categories/queries/getCategory"
import { Category } from "@/src/app/(internal)/categories/components/Category"
import CategoryHeader from "@/src/app/(internal)/categories/[categoryId]/header"
import { Page, PageContent } from "@/src/lib/components/content/page"

async function fetchCategory(id: string) {
    return invoke(getCategory, { id: id })
}

export async function generateMetadata(props: CategoryPageProps): Promise<Metadata> {
    const params = await props.params
    const category = await fetchCategory(params.categoryId)
    return {
        title: category.name
    }
}

type CategoryPageProps = {
    params: Promise<{ categoryId: string }>
}

export default async function CategoryPage(props: Readonly<CategoryPageProps>) {
    const params = await props.params
    const category = await fetchCategory(params.categoryId)

    return (
        <Page>
            <CategoryHeader category={category} />
            <PageContent>
                <Suspense fallback={<div>Loading...</div>}>
                    <Category categoryId={params.categoryId} />
                </Suspense>
            </PageContent>
        </Page>
    )
}
