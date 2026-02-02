"use client"

import { useState } from "react"
import { useMutation } from "@blitzjs/rpc"
import changePassword from "@/src/lib/model/auth/mutations/changePassword"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/src/lib/components/ui/dialog"
import { Button } from "@/src/lib/components/ui/button"
import { Key } from "lucide-react"
import Form, { FORM_ERROR } from "@/src/lib/components/common/form/Form"
import TextField from "@/src/lib/components/common/form/elements/TextField"
import { ChangePasswordFormSchema } from "@/src/lib/model/user/schemas"

interface ChangePasswordDialogProps {
    onSuccess?: () => void
}

interface PasswordFormValues {
    currentPassword: string
    newPassword: string
    confirmPassword: string
}

export function ChangePasswordDialog({ onSuccess }: ChangePasswordDialogProps) {
    const [open, setOpen] = useState(false)
    const [changePasswordMutation] = useMutation(changePassword)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant={"outline"}>
                    <Key className={"h-4 w-4"} />
                    Change Password
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                    <DialogDescription>
                        Enter your current password and choose a new password.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    schema={ChangePasswordFormSchema}
                    initialValues={{
                        currentPassword: "",
                        newPassword: "",
                        confirmPassword: ""
                    }}
                    submitText={"Change Password"}
                    onSubmit={async (values) => {
                        try {
                            await changePasswordMutation({
                                currentPassword: values.currentPassword,
                                newPassword: values.newPassword
                            })
                            setOpen(false)
                            onSuccess?.()
                        } catch (error: unknown) {
                            const message = error instanceof Error ? error.message : "Failed to change password"
                            return { [FORM_ERROR]: message }
                        }
                    }}
                >
                    <TextField<PasswordFormValues, string>
                        label={"Current Password"}
                        name={"currentPassword"}
                        type={"password"}
                        required
                    />
                    <TextField<PasswordFormValues, string>
                        label={"New Password"}
                        name={"newPassword"}
                        type={"password"}
                        required
                        description={"Minimum 10 characters"}
                    />
                    <TextField<PasswordFormValues, string>
                        label={"Confirm New Password"}
                        name={"confirmPassword"}
                        type={"password"}
                        required
                    />
                </Form>
            </DialogContent>
        </Dialog>
    )
}
