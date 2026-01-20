"use client"
import { invalidateQuery, useMutation } from "@blitzjs/rpc"
import { Download, Eye, Paperclip, Trash2 } from "lucide-react"
import { Button } from "@/src/lib/components/ui/button"
import deleteAttachment from "@/src/lib/model/transactions/mutations/deleteAttachment"
import getTransaction from "@/src/lib/model/transactions/queries/getTransaction"
import Section from "@/src/lib/components/common/structure/Section"
import { useState } from "react"
import { DataTable, TableColumn } from "@/src/lib/components/common/data/table"
import { ConfirmationDialog } from "@/src/lib/components/common/dialog/ConfirmationDialog"
import { toast } from "sonner"
import type {
    AttachmentUploadError,
    AttachmentUploadResponse
} from "@/src/app/api/transactions/attachments/upload/route"
import { Badge } from "@/src/lib/components/ui/badge"
import { Attachment } from "@prisma/client"
import { formatFileSize } from "@/src/lib/util/formatter/FileSizeFormatter"
import { WithFormattersProps } from "@/src/lib/util/formatter/withFormatters"

interface AttachmentListProps extends WithFormattersProps {
    transactionId: string
    attachments: Attachment[]
}

export const AttachmentList = ({ transactionId, attachments, formatters }: AttachmentListProps) => {
    const [deleteAttachmentMutation] = useMutation(deleteAttachment)
    const [isUploading, setIsUploading] = useState(false)

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        setIsUploading(true)

        const uploadPromise = (async () => {
            const formData = new FormData()
            formData.append("file", file)

            const response = await fetch(`/api/transactions/attachments/upload?transactionId=${transactionId}`, {
                method: "POST",
                body: formData
            })

            const data: AttachmentUploadResponse | AttachmentUploadError = await response.json()

            if (!response.ok || "error" in data) {
                throw new Error("error" in data ? data.error : "Upload failed")
            }

            await invalidateQuery(getTransaction, { id: transactionId })
        })()

        toast.promise(uploadPromise, {
            loading: "Uploading attachment...",
            success: () => {
                setIsUploading(false)
                return "Attachment uploaded successfully"
            },
            error: (e) => {
                setIsUploading(false)
                return e.message ?? "Failed to upload attachment"
            }
        })
    }

    const handleDelete = async (attachment: Attachment) => {
        const confirmed = await ConfirmationDialog({
            title: "Delete attachment",
            description: `Are you sure you want to delete "${attachment.name}"? This action cannot be undone.`
        })

        if (!confirmed) return

        const deletePromise = deleteAttachmentMutation({ id: attachment.id })

        toast.promise(deletePromise, {
            loading: "Deleting attachment...",
            success: async () => {
                await invalidateQuery(getTransaction, { id: transactionId })
                return "Attachment deleted successfully"
            },
            error: (e) => e.message ?? "Failed to delete attachment"
        })
    }

    const columns: TableColumn<Attachment>[] = [
        {
            name: "Name",
            isKey: true,
            render: (attachment: Attachment) => (
                <span className="font-medium truncate" title={attachment.name}>
                    {attachment.name}
                </span>
            )
        },
        {
            name: "Size",
            render: (attachment: Attachment) =>
                <Badge variant={"secondary-code"}>{formatFileSize(attachment.size)}</Badge>
        },
        {
            name: "Type",
            render: (attachment: Attachment) =>
                <Badge variant={"secondary-code"}>{attachment.type}</Badge>
        },
        {
            name: "Uploaded At",
            render: (attachment: Attachment) => formatters.date.format(new Date(attachment.createdAt), { withTime: true })
        },
        {
            name: "",
            render: (attachment: Attachment) => (
                <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" asChild>
                        <a href={`/api/transactions/attachments/download/${attachment.id}`} target="_blank"
                           rel="noreferrer">
                            <Eye className="h-4 w-4" />
                        </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <a href={`/api/transactions/attachments/download/${attachment.id}?download=true`}>
                            <Download className="h-4 w-4" />
                        </a>
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(attachment)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            )
        }
    ]

    return (
        <Section title={"Attachments"}
                 subtitle={"Documents and files associated with this transaction."}
                 actions={
                     <div className="flex items-center gap-2">
                         <label
                             className={`cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}>
                             <Paperclip className="mr-2 h-4 w-4" />
                             {isUploading ? "Uploading..." : "Add Attachment"}
                             <input type="file" className="hidden" onChange={handleUpload} disabled={isUploading} />
                         </label>
                     </div>
                 }>
            <DataTable data={attachments} columns={columns} />
        </Section>
    )
}
