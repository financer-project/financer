import { Metadata } from "next"
import { Suspense } from "react"
import { invoke } from "@/src/app/blitz-server"
import getCategory from "@/src/lib/model/categories/queries/getCategory"
import { Category } from "@/src/app/(internal)/categories/components/Category"
import CategoryHeader from "@/src/app/(internal)/categories/[categoryId]/header"

async function fetchCategory(id: string) {
    return invoke(getCategory, { id: id })
}

export async function generateMetadata(props: CategoryPageProps): Promise<Metadata> {
    const params = await props.params
    const category = await fetchCategory(params.categoryId)
    return {
        title: `Category ${category.id} - ${category.name}`
    }
}

type CategoryPageProps = {
    params: Promise<{ categoryId: string }>
}

export default async function Page(props: CategoryPageProps) {
    const params = await props.params
    const category = await fetchCategory(params.categoryId)

    return (
        <div>
            <CategoryHeader category={category} />
            <Suspense fallback={<div>Loading...</div>}>
                <Category categoryId={params.categoryId} />
            </Suspense>
        </div>
    )
}
