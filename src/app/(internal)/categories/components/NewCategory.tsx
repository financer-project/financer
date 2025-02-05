"use client"
import { CategoryForm } from "./CategoryForm"
import { CreateCategorySchema } from "@/src/lib/model/categories/schemas"
import { useMutation } from "@blitzjs/rpc"
import createCategory from "@/src/lib/model/categories/mutations/createCategory"
import { useRouter } from "next/navigation"
import { FORM_ERROR } from "@/src/lib/components/common/form/Form"

export function NewCategory() {
    const [createCategoryMutation] = useMutation(createCategory)
    const router = useRouter()
    return (
        <CategoryForm
            submitText="Create Category"
            schema={CreateCategorySchema}
            onSubmit={async (values) => {
                try {
                    await createCategoryMutation(values)
                    router.push(`/categories`)
                } catch (error: any) {
                    console.error(error)
                    return {
                        [FORM_ERROR]: error.toString()
                    }
                }
            }}
        />
    )
}
