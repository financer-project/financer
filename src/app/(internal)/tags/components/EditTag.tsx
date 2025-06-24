"use client"
import { Suspense } from "react"
import updateTag from "@/src/lib/model/tags/mutations/updateTag"
import getTag from "@/src/lib/model/tags/queries/getTag"
import { UpdateTagSchema } from "@/src/lib/model/tags/schemas"
import { TagForm } from "./TagForm"
import { useMutation, useQuery } from "@blitzjs/rpc"
import { useRouter } from "next/navigation"
import { FORM_ERROR } from "@/src/lib/components/common/form/Form"
import ColorType from "@/src/lib/model/common/ColorType"

export const EditTag = ({ tagId }: { tagId: string }) => {
    const [tag] = useQuery(getTag, { id: tagId }, { staleTime: Infinity })
    const [updateTagMutation] = useMutation(updateTag)
    const router = useRouter()
    return (
        <div>
            <Suspense fallback={<div>Loading...</div>}>
                <TagForm
                    submitText="Update Tag"
                    schema={UpdateTagSchema}
                    initialValues={{ ...tag, color: tag.color as ColorType | null }}
                    onSubmit={async (values) => {
                        try {
                            await updateTagMutation({ ...values, id: tag.id })
                            router.push("/tags")
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