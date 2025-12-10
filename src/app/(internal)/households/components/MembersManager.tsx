"use client"

import { useMutation, useQuery } from "@blitzjs/rpc"
import getHousehold, { HouseholdModel } from "@/src/lib/model/household/queries/getHousehold"
import addHouseholdMember from "@/src/lib/model/household/mutations/addHouseholdMember"
import updateHouseholdMember from "@/src/lib/model/household/mutations/updateHouseholdMember"
import removeHouseholdMember from "@/src/lib/model/household/mutations/removeHouseholdMember"
import { useState } from "react"
import { Input } from "@/src/lib/components/ui/input"
import { Button } from "@/src/lib/components/ui/button"
import { Badge } from "@/src/lib/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/lib/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/src/lib/components/ui/alert-dialog"
import { $Enums } from "@prisma/client"
import { useToast } from "@/src/lib/hooks/use-toast"

type Member = HouseholdModel["members"][number]

export default function MembersManager({ householdId }: Readonly<{ householdId: string }>) {
    const { toast } = useToast()
    const [email, setEmail] = useState("")
    const [role, setRole] = useState<$Enums.HouseholdRole>($Enums.HouseholdRole.MEMBER)
    const [accessLevel, setAccessLevel] = useState<$Enums.AccessLevel>($Enums.AccessLevel.FULL)

    const [household, { refetch }] = useQuery(getHousehold, { id: householdId })

    const [addMemberMutation, { isLoading: isAdding }] = useMutation(addHouseholdMember)
    const [updateMemberMutation] = useMutation(updateHouseholdMember)
    const [removeMemberMutation] = useMutation(removeHouseholdMember)

    const onAdd = async () => {
        try {
            await addMemberMutation({ id: householdId, email, role, accessLevel })
            await refetch()
            setEmail("")
            toast({ title: "Member added", description: `Added ${email} to ${household.name}.` })
        } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            toast({ title: "Could not add member", description: e.message ?? String(e) })
        }
    }

    const onUpdate = async (m: Member, next: { role?: $Enums.HouseholdRole, accessLevel?: $Enums.AccessLevel }) => {
        try {
            await updateMemberMutation({ id: householdId, userId: m.userId, role: next.role ?? m.role, accessLevel: next.accessLevel ?? m.accessLevel })
            await refetch()
            toast({ title: "Member updated", description: `${m.user.email} updated.` })
        } catch (e: any) {
            toast({ title: "Could not update member", description: e.message ?? String(e) })
        }
    }

    const onRemove = async (m: Member) => {
        try {
            await removeMemberMutation({ id: householdId, userId: m.userId })
            await refetch()
            toast({ title: "Member removed", description: `${m.user.email} removed.` })
        } catch (e: any) {
            toast({ title: "Could not remove member", description: e.message ?? String(e) })
        }
    }

    const members = household.members

    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                <div className="md:col-span-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input placeholder="user@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                    <label className="text-sm font-medium">Role</label>
                    <Select value={role} onValueChange={(v) => setRole(v as $Enums.HouseholdRole)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.values($Enums.HouseholdRole).map((r) => (
                                <SelectItem key={r} value={r}>{r}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label className="text-sm font-medium">Access</label>
                    <Select value={accessLevel} onValueChange={(v) => setAccessLevel(v as $Enums.AccessLevel)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select access" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.values($Enums.AccessLevel).map((a) => (
                                <SelectItem key={a} value={a}>{a}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Button disabled={!email || isAdding} onClick={onAdd}>Add member</Button>
                </div>
            </div>

            <div className="rounded-md border">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                    <tr>
                        <th className="text-left p-2">Name</th>
                        <th className="text-left p-2">Email</th>
                        <th className="text-left p-2">Role</th>
                        <th className="text-left p-2">Access</th>
                        <th className="text-right p-2">Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {members.map((m) => (
                        <tr key={m.id} className="border-t">
                            <td className="p-2">{m.user.firstName || m.user.lastName ? `${m.user.firstName ?? ""} ${m.user.lastName ?? ""}`.trim() : <Badge variant="secondary">No name</Badge>}</td>
                            <td className="p-2">{m.user.email}</td>
                            <td className="p-2">
                                <Select value={m.role} onValueChange={(v) => onUpdate(m, { role: v as $Enums.HouseholdRole })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.values($Enums.HouseholdRole).map((r) => (
                                            <SelectItem key={r} value={r}>{r}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </td>
                            <td className="p-2">
                                <Select value={m.accessLevel} onValueChange={(v) => onUpdate(m, { accessLevel: v as $Enums.AccessLevel })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.values($Enums.AccessLevel).map((a) => (
                                            <SelectItem key={a} value={a}>{a}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </td>
                            <td className="p-2 text-right">
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="outline">Remove</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Remove member</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will remove {m.user.email} from this household. This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => onRemove(m)}>Remove</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
