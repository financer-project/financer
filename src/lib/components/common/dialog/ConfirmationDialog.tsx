"use client"

import React, { useEffect, useState } from "react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/src/lib/components/ui/alert-dialog"
import { Button } from "@/src/lib/components/ui/button"
import { createRoot } from "react-dom/client"


export function ConfirmationDialog({ title, description }: { title: string; description: string }) {
    return new Promise<boolean>((resolve) => {
        const container = document.createElement("div")
        document.body.appendChild(container)

        const root = createRoot(container)

        const handleClose = (confirmed: boolean) => {
            resolve(confirmed)
            setTimeout(() => {
                root.unmount() // Dialog entfernen
                container.remove() // Container aus dem DOM löschen
            })
        }

        root.render(
            <DialogComponent
                title={title}
                description={description}
                onConfirm={() => handleClose(true)} // Benutzer hat bestätigt
                onCancel={() => handleClose(false)} // Benutzer hat abgebrochen
            />
        )
    })
}

interface DialogComponentProps {
    title: string
    description: string
    onConfirm: () => void
    onCancel: () => void
}

function DialogComponent({
                             title,
                             description,
                             onConfirm,
                             onCancel
                         }: Readonly<DialogComponentProps>) {
    const [open, setOpen] = useState(true)

    useEffect(() => {
        if (!open) {
            onCancel() // Schließen = Abbrechen
        }
    }, [open, onCancel])

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel asChild>
                        <Button onClick={() => setOpen(false)} variant="outline">
                            Cancel
                        </Button>
                    </AlertDialogCancel>
                    <AlertDialogAction asChild>
                        <Button onClick={onConfirm} variant="destructive">
                            Confirm
                        </Button>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}