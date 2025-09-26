"use client"
import { Suspense } from "react"
import updateCategory from "@/src/lib/model/categories/mutations/updateCategory"
import getCategory from "@/src/lib/model/categories/queries/getCategory"
import { UpdateCategorySchema } from "@/src/lib/model/categories/schemas"
import { CategoryForm } from "./CategoryForm"
import { useMutation, useQuery } from "@blitzjs/rpc"
import { useRouter } from "next/navigation"
import { FORM_ERROR } from "@/src/lib/components/common/form/Form"
import ColorType from "@/src/lib/model/common/ColorType"

export const EditCategory = ({ categoryId }: { categoryId: string }) => {
    const [category] = useQuery(getCategory, { id: categoryId }, { staleTime: Infinity })
    const [updateCategoryMutation] = useMutation(updateCategory)
    const router = useRouter()
    return (
        <div>
            <Suspense fallback={<div>Loading...</div>}>
                <CategoryForm
                    submitText="Update Category"
                    schema={UpdateCategorySchema}
                    initialValues={{ ...category, color: category?.color as ColorType ?? null }}
                    onSubmit={async (values) => {
                        try {
                            await updateCategoryMutation({ ...values, id: category.id })
                            router.push("/categories")
                        } catch (error: any) { //eslint-disable-line @typescript-eslint/no-explicit-any
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
