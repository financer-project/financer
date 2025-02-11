"use client"
import { Suspense } from "react"
import updateCategory from "@/src/lib/model/categories/mutations/updateCategory"
import getCategory from "@/src/lib/model/categories/queries/getCategory"
import { UpdateCategorySchema } from "@/src/lib/model/categories/schemas"
import { CategoryForm } from "./CategoryForm"
import { useMutation, useQuery } from "@blitzjs/rpc"
import { useRouter } from "next/navigation"
import { FORM_ERROR } from "@/src/lib/components/common/form/Form"

export const EditCategory = ({ categoryId }: { categoryId: string }) => {
    const [category, { setQueryData }] = useQuery(
        getCategory,
        { id: categoryId },
        { staleTime: Infinity }
    )
    const [updateCategoryMutation] = useMutation(updateCategory)
    const router = useRouter()
    return (
        <div>
            <Suspense fallback={<div>Loading...</div>}>
                <CategoryForm
                    submitText="Update Category"
                    schema={UpdateCategorySchema}
                    initialValues={category}
                    onSubmit={async (values) => {
                        try {
                            const updated = await updateCategoryMutation({
                                ...values,
                                id: category.id
                            })
                            await setQueryData(updated)
                            router.refresh()
                        } catch (error: any) {
                            console.error(error)
                            return {
                                [FORM_ERROR]: error.toString()
                            }
                        }
                    }}
                />
            </Suspense>
        </div>
    )
}
