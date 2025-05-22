"use client"

import React, { useState } from "react"
import TextField from "@/src/lib/components/common/form/elements/TextField"
import { Button } from "@/src/lib/components/ui/button"
import { useMutation } from "@blitzjs/rpc"
import inviteUser from "@/src/lib/model/auth/mutations/inviteUser"
import { toast } from "@/hooks/use-toast"
import SwitchField from "@/src/lib/components/common/form/elements/SwitchField"
import { Heading3 } from "@/src/lib/components/common/typography"

const UserManagementSection = () => {
    const [inviteUserMutation] = useMutation(inviteUser)
    const [inviteEmail, setInviteEmail] = useState("")
    const [isInviting, setIsInviting] = useState(false)

    const handleInviteUser = async () => {
        if (!inviteEmail) {
            toast({
                title: "Email is required",
                variant: "destructive"
            })
            return
        }

        try {
            setIsInviting(true)
            await inviteUserMutation({ email: inviteEmail })
            toast({
                title: "Invitation sent successfully!",
                description: `An invitation has been sent to ${inviteEmail}.`,
                variant: "default"
            })
            setInviteEmail("")
        } catch (error: any) { //eslint-disable-line @typescript-eslint/no-explicit-any
            toast({
                title: "Failed to send invitation",
                description: error.toString(),
                variant: "destructive"
            })
        } finally {
            setIsInviting(false)
        }
    }

    return (
        <>
            <Heading3>Settings</Heading3>
            <div className={"flex flex-col gap-4 xl:w-1/2 w-full"}>
                <SwitchField
                    name={"allowRegistration"}
                    label={"Allow new user registration"}
                    description={"When checked, users can register themselves without an invitation code."} />
            </div>
            <div className={"flex flex-row gap-2"}>
                <div className={"flex-grow"}>
                    <TextField
                        name={"inviteUserEmail"}
                        type={"email"}
                        label={"Email Address"}
                        placeholder="Enter email address to invite"
                        description={"Send an invitation email to allow someone to join your Financer App."}
                        value={inviteEmail}
                        onChange={(email) => email && setInviteEmail(email)}
                    />
                </div>
                <Button
                    type="button"
                    className={"mt-5.5"}
                    variant={"outline"}
                    onClick={handleInviteUser}
                    disabled={isInviting}>
                    {isInviting ? "Sending..." : "Send Invitation"}
                </Button>
            </div>
            <Heading3>Users</Heading3>
            <div>

            </div>
        </>
    )
}

export default UserManagementSection