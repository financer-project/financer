"use client"

import Header from "@/src/lib/components/content/nav/Header"
import React from "react"
import { Button } from "@/src/lib/components/ui/button"
import Link from "next/link"
import { useMutation } from "@blitzjs/rpc"
import deleteHousehold from "@/src/lib/model/household/mutations/deleteHousehold"
import { useRouter } from "next/navigation"
import { ConfirmationDialog } from "@/src/lib/components/common/dialog/ConfirmationDialog"
import { Household } from "@prisma/client"

export default function HouseholdHeader({ household }: Readonly<{ household: Household }>) {
    const router = useRouter()
    const [deleteHouseholdMutation] = useMutation(deleteHousehold)

    const renderHeaderButtons = () => (
        <div className={"flex gap-2"}>
            <Button variant={"outline"} asChild>
                <Link href={`/households/${household.id}/edit`}>Edit</Link>
            </Button>
            <Button variant={"destructive"} onClick={async () => {
                const confirmed = await ConfirmationDialog({
                    title: "Do you really want to delete this household?",
                    description: "Deleting a household is irreversible and will delete all associated accounts and transactions."
                })

                if (confirmed) {
                    await deleteHouseholdMutation({ id: household.id })
                    router.push("/households")
                }
            }}>
                Delete
            </Button>
        </div>
    )

    return (
        <Header title={"Household Details"}
                subtitle={"Here can you edit, delete and view the household details."}
                breadcrumbs={[
                    { label: "Households", url: "/households" },
                    { label: household.name, url: "" }
                ]}
                actions={renderHeaderButtons} />
    )
}