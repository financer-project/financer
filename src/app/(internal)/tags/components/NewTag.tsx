"use client"
import { TagForm } from "./TagForm"
import { CreateTagSchema } from "@/src/lib/model/tags/schemas"
import { useMutation } from "@blitzjs/rpc"
import createTag from "@/src/lib/model/tags/mutations/createTag"
import { useRouter } from "next/navigation"
import { FORM_ERROR } from "@/src/lib/components/common/form/Form"

export function NewTag() {
    const [createTagMutation] = useMutation(createTag)
    const router = useRouter()
    return (
        <TagForm
            submitText="Create Tag"
            schema={CreateTagSchema}
            onSubmit={async (values) => {
                try {
                    await createTagMutation(values)
                    router.push(`/tags`)
                } catch (error: any) { //eslint-disable-line @typescript-eslint/no-explicit-any
                    console.error(error)
                    return {
                        [FORM_ERROR]: error.toString()
                    }
                }
            }}
        />
    )
}