"use client"

import { Button } from "@/src/lib/components/ui/button"
import { useMutation } from "@blitzjs/rpc"
import { useRouter } from "next/navigation"
import Header from "@/src/lib/components/content/nav/Header"
import { ConfirmationDialog } from "@/src/lib/components/common/dialog/ConfirmationDialog"
import { ImportStatus } from "@prisma/client"
import startImport from "@/src/lib/model/imports/mutations/startImport"
import { ImportJobModel } from "@/src/lib/model/imports/queries/getImportJob"

const ImportJobHeader = ({ importJob }: { importJob: ImportJobModel }) => {
    const [startImportMutation] = useMutation(startImport)
    const router = useRouter()

    const renderActions = (importJob: ImportJobModel) => (
        <div className={"flex flex-row gap-4"}>
            {importJob.status === ImportStatus.DRAFT && (
                <Button 
                    variant={"default"}
                    onClick={async () => {
                        const confirmed = await ConfirmationDialog({
                            title: "Start Import Process",
                            description: "Do you want to start the import process? This will process the CSV file and create transactions."
                        })

                        if (confirmed) {
                            await startImportMutation({ id: importJob.id })
                            router.refresh()
                        }
                    }}>
                    Start Import
                </Button>
            )}
        </div>
    )

    return (
        <Header title={"Import Job Details"}
                subtitle={"Here can you edit, delete and view the import job details."}
                breadcrumbs={[
                    { label: "Imports", url: "/imports" },
                    { label: importJob.name }
                ]}
                actions={renderActions(importJob)} />
    )
}
export default ImportJobHeader