"use client"

import React, { useState } from "react"
import TextField from "@/src/lib/components/common/form/elements/TextField"
import { Button } from "@/src/lib/components/ui/button"
import { useMutation, usePaginatedQuery } from "@blitzjs/rpc"
import inviteUser from "@/src/lib/model/auth/mutations/inviteUser"
import { toast } from "@/src/lib/hooks/use-toast"
import SwitchField from "@/src/lib/components/common/form/elements/SwitchField"
import { Heading3 } from "@/src/lib/components/common/typography"
import { DataTable } from "@/src/lib/components/common/data/DataTable"
import { useSearchParams } from "next/navigation"
import getUsers from "@/src/lib/model/auth/queries/getUsers"
import Link from "next/link"

const ITEMS_PER_PAGE = 10

const UserManagementSection = () => {
    const searchParams = useSearchParams()
    const page = Number(searchParams?.get("page") ?? 0)
    const [{ users, hasMore }] = usePaginatedQuery(getUsers, { skip: ITEMS_PER_PAGE * page, take: ITEMS_PER_PAGE })

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
        } catch (error: unknown) {
            toast({
                title: "Failed to send invitation",
                description: (error as Error).message,
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
                <DataTable
                    data={users}
                    hasMore={hasMore}
                    columns={[
                        {
                            name: "Name",
                            render: (user) => `${user.firstName} ${user.lastName}`,
                            isKey: true
                        },
                        {
                            name: "Email",
                            render: (user) =>
                                <Button variant={"link"} size={"sm"} asChild>
                                    <Link href={`mailto:${user.email}`}>{user.email}</Link>
                                </Button>
                        }
                    ]} />
            </div>
        </>
    )
}

export default UserManagementSection