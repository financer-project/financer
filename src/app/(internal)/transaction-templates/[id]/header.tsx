"use client"

import { Button } from "@/src/lib/components/ui/button"
import Link from "next/link"
import { useMutation } from "@blitzjs/rpc"
import { useRouter } from "next/navigation"
import { PageActions, PageDescription, PageHeader, PageTitle } from "@/src/lib/components/content/page"
import { ConfirmationDialog } from "@/src/lib/components/common/dialog/ConfirmationDialog"
import deleteTransactionTemplate from "@/src/lib/model/transactionTemplates/mutations/deleteTransactionTemplate"
import { TransactionTemplate } from "@prisma/client"

const TransactionTemplateHeader = ({ template }: { template: TransactionTemplate }) => {
    const [deleteTemplateMutation] = useMutation(deleteTransactionTemplate)
    const router = useRouter()

    return (
        <PageHeader items={[
            { label: "Transaction Templates", url: "/transaction-templates" },
            { label: template.name }
        ]}>
            <PageTitle>{template.name}</PageTitle>
            <PageDescription>View and manage this recurring transaction template.</PageDescription>
            <PageActions>
                <div className={"flex flex-row gap-2"}>
                    <Button variant={"outline"} asChild>
                        <Link href={`/transaction-templates/${template.id}/edit`}>Edit</Link>
                    </Button>
                    <Button
                        variant={"destructive"}
                        onClick={async () => {
                            const confirmed = await ConfirmationDialog({
                                title: "Delete transaction template?",
                                description: "This will permanently delete the template. Existing transactions generated from it will not be affected."
                            })
                            if (confirmed) {
                                await deleteTemplateMutation({ id: template.id })
                                router.push("/transaction-templates")
                            }
                        }}>
                        Delete
                    </Button>
                </div>
            </PageActions>
        </PageHeader>
    )
}

export default TransactionTemplateHeader
