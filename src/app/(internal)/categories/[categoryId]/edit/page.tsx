import { Metadata } from "next"
import { Suspense } from "react"
import { invoke } from "@/src/app/blitz-server"
import getCategory from "@/src/lib/model/categories/queries/getCategory"
import { EditCategory } from "@/src/app/(internal)/categories/components/EditCategory"

type EditCategoryPageProps = {
  params: Promise<{ categoryId: string }>
}

export async function generateMetadata(props: EditCategoryPageProps): Promise<Metadata> {
  const params = await props.params
  const Category = await invoke(getCategory, { id: Number(params.categoryId) })
  return {
    title: `Edit Category ${Category.id} - ${Category.name}`,
  }
}

export default async function Page(props: EditCategoryPageProps) {
  const params = await props.params
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <EditCategory categoryId={Number(params.categoryId)} />
      </Suspense>
    </div>
  )
}
