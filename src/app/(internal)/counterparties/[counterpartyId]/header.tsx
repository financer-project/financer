"use client"

import { Button } from "@/src/lib/components/ui/button"
import Link from "next/link"
import { useMutation } from "@blitzjs/rpc"
import { useRouter } from "next/navigation"
import { PageHeader, PageTitle, PageDescription, PageActions } from "@/src/lib/components/content/page"
import { ConfirmationDialog } from "@/src/lib/components/common/dialog/ConfirmationDialog"
import deleteCounterparty from "@/src/lib/model/counterparties/mutations/deleteCounterparty"
import { Counterparty } from "@prisma/client"

const CounterpartyHeader = ({ counterparty }: { counterparty: Counterparty }) => {
    const [deleteCounterpartyMutation] = useMutation(deleteCounterparty)
    const router = useRouter()

    const renderActions = (counterparty: Counterparty) => (
        <div className={"flex flex-row gap-2"}>
            <Button variant={"outline"} asChild>
                <Link href={`/counterparties/${counterparty.id}/edit`}>Edit</Link>
            </Button>
            <Button
                variant={"destructive"}
                onClick={async () => {
                    const confirmed = await ConfirmationDialog({
                        title: "Do you really want to delete this counterparty?",
                        description: "Deleting a counterparty is irreversible and will remove it from all associated transactions."
                    })

                    if (confirmed) {
                        await deleteCounterpartyMutation({ id: counterparty.id })
                        router.push("/counterparties")
                    }
                }}>
                Delete
            </Button>
        </div>
    )

    return (
        <PageHeader items={[
            { label: "Counterparties", url: "/counterparties" },
            { label: counterparty.name }
        ]}>
            <PageTitle>Counterparty</PageTitle>
            <PageDescription>Here you can see all details of your counterparty.</PageDescription>
            <PageActions>{renderActions(counterparty)}</PageActions>
        </PageHeader>
    )
}
export default CounterpartyHeader