"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/src/lib/components/ui/dialog"
import { useEffect, useState } from "react"
import { useMutation } from "@blitzjs/rpc"
import createHousehold from "@/src/lib/model/household/mutations/createHousehold"
import { HouseholdForm } from "@/src/app/(internal)/households/components/HouseholdForm"
import { CreateHouseholdSchema } from "@/src/lib/model/household/schemas"
import changeCurrentHousehold from "@/src/lib/model/household/mutations/changeCurrentHousehold"
import { toast } from "sonner"

export function RequireHouseholdDialog({ hasHousehold }: Readonly<{ hasHousehold: boolean }>) {
    const [open, setOpen] = useState(!hasHousehold)
    const [createHouseholdMutation] = useMutation(createHousehold)
    const [changeCurrentHouseholdMutation] = useMutation(changeCurrentHousehold)

    useEffect(() => {
        setOpen(!hasHousehold)
    }, [hasHousehold])

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            // Prevent closing the dialog if no household exists
            if (!hasHousehold) {
                setOpen(true)
            } else {
                setOpen(isOpen)
            }
        }}>
            <DialogContent
                className="sm:max-w-[600px]"
                onInteractOutside={(e) => {
                    // Prevent closing by clicking outside if no household exists
                    if (!hasHousehold) {
                        e.preventDefault()
                    }
                }}
                onEscapeKeyDown={(e) => {
                    // Prevent closing with Escape if no household exists
                    if (!hasHousehold) {
                        e.preventDefault()
                    }
                }}
                hideCloseButton={!hasHousehold}>
                <DialogHeader>
                    <DialogTitle>Create Your First Household</DialogTitle>
                    <DialogDescription>
                        You need to create a household to start managing your finances.
                        A household is where you'll track accounts, transactions, and more.
                    </DialogDescription>
                </DialogHeader>
                <HouseholdForm
                    submitText="Create Household"
                    schema={CreateHouseholdSchema}
                    onSubmit={(values) => {
                        const promise = async () => {
                            const household = await createHouseholdMutation(values)
                            await changeCurrentHouseholdMutation({ id: household.id })
                            return household
                        }

                        toast.promise(promise, {
                            loading: "Creating household...",
                            success: () => {
                                setOpen(false)
                                location.reload()
                                return "Household created successfully."
                            },
                            error: (error) => ({ message: "Household could not be created.", description: error })
                        })
                    }}
                />
            </DialogContent>
        </Dialog>
    )
}
