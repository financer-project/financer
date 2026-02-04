"use client"

import React from "react"
import { invalidateQuery, useMutation } from "@blitzjs/rpc"
import { CounterpartyForm } from "@/src/app/(internal)/counterparties/components/CounterpartyForm"
import { CreateCounterpartySchema } from "@/src/lib/model/counterparties/schemas"
import createCounterparty from "@/src/lib/model/counterparties/mutations/createCounterparty"
import getCounterparties from "@/src/lib/model/counterparties/queries/getCounterparties"
import { useCurrentHousehold } from "@/src/lib/components/provider/HouseholdProvider"
import { FORM_ERROR } from "@/src/lib/components/common/form/Form"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/src/lib/components/ui/dialog"

interface CreateCounterpartyDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onCreated: (counterpartyId: string) => void
}

export function CreateCounterpartyDialog({ open, onOpenChange, onCreated }: Readonly<CreateCounterpartyDialogProps>) {
    const [createCounterpartyMutation] = useMutation(createCounterparty)
    const currentHousehold = useCurrentHousehold()

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Counterparty</DialogTitle>
                </DialogHeader>
                <CounterpartyForm
                    submitText="Create Counterparty"
                    schema={CreateCounterpartySchema}
                    onSubmit={async (values) => {
                        try {
                            const counterparty = await createCounterpartyMutation(values)
                            await invalidateQuery(getCounterparties, { householdId: currentHousehold!.id })
                            onCreated(counterparty.id)
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
