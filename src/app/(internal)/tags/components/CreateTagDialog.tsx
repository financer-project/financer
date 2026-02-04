"use client"

import React from "react"
import { invalidateQuery, useMutation } from "@blitzjs/rpc"
import { TagForm } from "@/src/app/(internal)/tags/components/TagForm"
import { CreateTagSchema } from "@/src/lib/model/tags/schemas"
import createTag from "@/src/lib/model/tags/mutations/createTag"
import getTags from "@/src/lib/model/tags/queries/getTags"
import { useCurrentHousehold } from "@/src/lib/components/provider/HouseholdProvider"
import { FORM_ERROR } from "@/src/lib/components/common/form/Form"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/src/lib/components/ui/dialog"

interface CreateTagDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onCreated: (tagId: string) => void
}

export function CreateTagDialog({ open, onOpenChange, onCreated }: Readonly<CreateTagDialogProps>) {
    const [createTagMutation] = useMutation(createTag)
    const currentHousehold = useCurrentHousehold()

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Tag</DialogTitle>
                </DialogHeader>
                <TagForm
                    submitText="Create Tag"
                    schema={CreateTagSchema}
                    onSubmit={async (values) => {
                        try {
                            const tag = await createTagMutation(values)
                            await invalidateQuery(getTags, { householdId: currentHousehold!.id })
                            onCreated(tag.id)
                            onOpenChange(false)
                        } catch (error: unknown) {
                            console.error(error)
                            return {
                                [FORM_ERROR]: String(error)
                            }
                        }
                    }}
                />
            </DialogContent>
        </Dialog>
    )
}
