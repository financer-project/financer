"use client"

import { useRouter } from "next/navigation"
import { useMutation } from "@blitzjs/rpc"
import { Button } from "@/src/lib/components/ui/button"
import Link from "next/link"
import { ConfirmationDialog } from "@/src/lib/components/common/dialog/ConfirmationDialog"
import React from "react"
import deleteAccount from "@/src/lib/model/account/mutations/deleteAccount"
import { PageHeader, PageTitle, PageDescription, PageActions } from "@/src/lib/components/content/page"
import { AccountModel } from "@/src/lib/model/account/queries/getAccount"

const AccountHeader = ({ account }: { account: AccountModel }) => {
    const router = useRouter()
    const [deleteAccountMutation] = useMutation(deleteAccount)

    const renderHeaderButtons = () => (
        <div className={"flex gap-2"}>
            <Button variant={"outline"} asChild>
                <Link href={`/households/${account.household.id}/accounts/${account.id}/edit`}>Edit</Link>
            </Button>
            <Button variant={"destructive"} onClick={async () => {
                const confirmed = await ConfirmationDialog({
                    title: "Do you really want to delete this account?",
                    description: "Deleting an account is irreversible and will delete all associated transactions."
                })

                if (confirmed) {
                    await deleteAccountMutation({ id: account.id })
                    router.push(`/households/${account.household.id}`)
                }
            }}>
                Delete
            </Button>
        </div>
    )

    return (
        <PageHeader items={[
            { label: "Households", url: "/households" },
            { label: account.household.name, url: `/households/${account.householdId}` },
            { label: account.name }
        ]}>
            <PageTitle>Account Details</PageTitle>
            <PageDescription>Here can you edit, delete and view the account details.</PageDescription>
            <PageActions>{renderHeaderButtons()}</PageActions>
        </PageHeader>
    )
}

export default AccountHeader