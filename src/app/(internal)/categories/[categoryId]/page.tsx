import { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { invoke } from "@/src/app/blitz-server"
import getCategory from "@/src/lib/model/categories/queries/getCategory"
import { Category } from "@/src/app/(internal)/categories/components/Category"

export async function generateMetadata(props: CategoryPageProps): Promise<Metadata> {
  const params = await props.params
  const Category = await invoke(getCategory, { id: Number(params.categoryId) })
  return {
    title: `Category ${Category.id} - ${Category.name}`,
  }
}

type CategoryPageProps = {
  params: Promise<{ categoryId: string }>
}

export default async function Page(props: CategoryPageProps) {
  const params = await props.params
  return (
    <div>
      <p>
        <Link href={"/categorys"}>Categorys</Link>
      </p>
      <Suspense fallback={<div>Loading...</div>}>
        <Category categoryId={Number(params.categoryId)} />
      </Suspense>
    </div>
  )
}
