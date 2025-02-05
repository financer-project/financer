"use client"
import { useMutation, useQuery } from "@blitzjs/rpc"
import Link from "next/link"
import { useRouter } from "next/navigation"
import deleteCategory from "@/src/lib/model/categories/mutations/deleteCategory"
import getCategory from "@/src/lib/model/categories/queries/getCategory"

export const Category = ({ categoryId }: { categoryId: number }) => {
  const router = useRouter()
  const [deleteCategoryMutation] = useMutation(deleteCategory)
  const [category] = useQuery(getCategory, { id: categoryId })

  return (
    <>
      <div>
        <h1>Project {category.id}</h1>
        <pre>{JSON.stringify(category, null, 2)}</pre>

        <Link href={`/categories/${category.id}/edit`}>Edit</Link>

        <button
          type="button"
          onClick={async () => {
            if (window.confirm("This will be deleted")) {
              await deleteCategoryMutation({ id: category.id })
              router.push("/categories")
            }
          }}
          style={{ marginLeft: "0.5rem" }}
        >
          Delete
        </button>
      </div>
    </>
  )
}
