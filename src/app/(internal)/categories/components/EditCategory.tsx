"use client"
import { Suspense } from "react"
import updateCategory from "@/src/lib/model/categories/mutations/updateCategory"
import getCategory from "@/src/lib/model/categories/queries/getCategory"
import { UpdateCategorySchema } from "../../../../lib/model/categories/schemas"
import { FORM_ERROR, CategoryForm } from "./CategoryForm"
import { useMutation, useQuery } from "@blitzjs/rpc"
import { useRouter } from "next/navigation"

export const EditCategory = ({ categoryId }: { categoryId: number }) => {
  const [category, { setQueryData }] = useQuery(
    getCategory,
    { id: categoryId },
    {
      // This ensures the query never refreshes and overwrites the form data while the user is editing.
      staleTime: Infinity,
    }
  )
  const [updateCategoryMutation] = useMutation(updateCategory)
  const router = useRouter()
  return (
    <>
      <div>
        <h1>Edit Category {category.id}</h1>
        <pre>{JSON.stringify(category, null, 2)}</pre>
        <Suspense fallback={<div>Loading...</div>}>
          <CategoryForm
            submitText="Update Category"
            schema={UpdateCategorySchema}
            initialValues={category}
            onSubmit={async (values) => {
              try {
                const updated = await updateCategoryMutation({
                  ...values,
                  id: category.id,
                })
                await setQueryData(updated)
                router.refresh()
              } catch (error: any) {
                console.error(error)
                return {
                  [FORM_ERROR]: error.toString(),
                }
              }
            }}
          />
        </Suspense>
      </div>
    </>
  )
}
