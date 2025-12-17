"use client"

import { useMutation, useQuery } from "@blitzjs/rpc"
import getHousehold, { HouseholdModel } from "@/src/lib/model/household/queries/getHousehold"
import addOrInviteHouseholdMember from "@/src/lib/model/household/mutations/addOrInviteHouseholdMember"
import updateHouseholdMember from "@/src/lib/model/household/mutations/updateHouseholdMember"
import removeHouseholdMember from "@/src/lib/model/household/mutations/removeHouseholdMember"
import { useMemo, useState } from "react"
import { Button } from "@/src/lib/components/ui/button"
import { Badge } from "@/src/lib/components/ui/badge"
import { $Enums, HouseholdRole } from "@prisma/client"
import { DataTable } from "@/src/lib/components/common/data/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/src/lib/components/ui/dialog"
import { HouseholdMemberForm, HouseholdMemberSchema } from "./HouseholdMemberForm"
import { toast } from "sonner"
import { ConfirmationDialog } from "@/src/lib/components/common/dialog/ConfirmationDialog"
import { useCurrentUser } from "@/src/lib/hooks/useCurrentUser"
import { Edit, Trash } from "lucide-react"

type Member = HouseholdModel["members"][number]

export default function HouseholdMemberList({ householdId }: Readonly<{ householdId: string }>) {
    const currentUser = useCurrentUser()
    const [household, { refetch }] = useQuery(getHousehold, { id: householdId })

    const [addMemberMutation] = useMutation(addOrInviteHouseholdMember)
    const [updateMemberMutation] = useMutation(updateHouseholdMember)
    const [removeMemberMutation] = useMutation(removeHouseholdMember)

    const [openCreate, setOpenCreate] = useState(false)
    const [editMember, setEditMember] = useState<Member | null>(null)

    const currentUserRole = useMemo(() => household.members.find(member => member.userId === currentUser.id)!.role, [currentUser, household.members])

    const isActionActive = (member: Member) =>
        member.userId !== currentUser.id && member.role !== HouseholdRole.OWNER && (currentUserRole === HouseholdRole.OWNER || currentUserRole === HouseholdRole.ADMIN)

    const handleDeleteMember = async (member: Member) => {
        const confirmed = await ConfirmationDialog({
            title: "Remove member",
            description: `This will remove ${member.user.email} from this household.`
        })
        if (confirmed) {
            const p = removeMemberMutation({ id: householdId, userId: member.userId })
            toast.promise(p, {
                loading: "Removing member...",
                success: async () => {
                    await refetch()
                    return "Member removed"
                },
                error: (e) => e.message ?? "Failed to remove member"
            })
        }
    }

    const columns = [
        {
            name: "Name",
            isKey: true,
            render: (m: Member) => (m.user.firstName || m.user.lastName)
                ? `${m.user.firstName ?? ""} ${m.user.lastName ?? ""}`.trim()
                : <Badge variant="secondary">No name</Badge>
        },
        { name: "Email", render: (m: Member) => m.user.email },
        { name: "Role", render: (m: Member) => <Badge variant="secondary">{m.role}</Badge> },
        {
            name: "",
            render: (member: Member) => (
                <div className="flex gap-2 justify-end">
                    <Dialog open={editMember?.id === member.id} onOpenChange={(o) => setEditMember(o ? member : null)}>
                        <DialogTrigger asChild>
                            <Button variant="outline"
                                    size={"sm"}
                                    disabled={!isActionActive(member)}>
                                <Edit />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Edit member</DialogTitle>
                            </DialogHeader>
                            <HouseholdMemberForm
                                schema={HouseholdMemberSchema}
                                initialValues={{ email: member.user.email, role: member.role }}
                                submitText="Save"
                                onSubmit={async (values) => {
                                    const p = updateMemberMutation({
                                        id: householdId,
                                        userId: member.userId,
                                        role: values.role
                                    })
                                    toast.promise(p, {
                                        loading: "Updating member...",
                                        success: async () => {
                                            setEditMember(null)
                                            await refetch()
                                            return "Member updated"
                                        },
                                        error: (e) => e.message ?? "Failed to update member"
                                    })

                                }}
                            />
                        </DialogContent>
                    </Dialog>
                    <Button variant="destructive"
                            size={"sm"}
                            disabled={!isActionActive(member)}
                            onClick={() => handleDeleteMember(member)}><Trash /></Button>
                </div>
            )
        }
    ]

    return (
        <div className="flex flex-col gap-4 w-full">
            <div className="flex justify-end">
                <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                    <DialogTrigger asChild>
                        <Button>Add member</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add member</DialogTitle>
                        </DialogHeader>
                        <HouseholdMemberForm
                            schema={HouseholdMemberSchema}
                            initialValues={{
                                role: $Enums.HouseholdRole.MEMBER,
                                email: ""
                            }}
                            submitText="Add"
                            onSubmit={(values) => {
                                const p = addMemberMutation({
                                    id: householdId,
                                    email: values.email,
                                    role: values.role
                                })
                                toast.promise(p, {
                                    loading: "Adding member...",
                                    success: async (result) => {
                                        setOpenCreate(false)
                                        await refetch()
                                        return result?.hasOwnProperty("invited")
                                            ? "Invitation to household has been sent."
                                            : "Member added successfully."
                                    },
                                    error: (e) => e.message ?? "Failed to add member"
                                })
                            }}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <DataTable data={household.members} columns={columns} />
        </div>
    )
}
