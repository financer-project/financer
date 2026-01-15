"use client"
import { useMutation, invalidateQuery } from "@blitzjs/rpc"
import { FileIcon, Trash2, Download, Paperclip } from "lucide-react"
import { Button } from "@/src/lib/components/ui/button"
import deleteAttachment from "@/src/lib/model/transactions/mutations/deleteAttachment"
import addAttachment from "@/src/lib/model/transactions/mutations/addAttachment"
import getTransaction from "@/src/lib/model/transactions/queries/getTransaction"
import Section from "@/src/lib/components/common/structure/Section"
import { useState } from "react"

interface Attachment {
    id: string
    name: string
    size: number
    type: string
}

interface AttachmentListProps {
    transactionId: string
    attachments: Attachment[]
}

export const AttachmentList = ({ transactionId, attachments }: AttachmentListProps) => {
    const [deleteAttachmentMutation] = useMutation(deleteAttachment)
    const [addAttachmentMutation] = useMutation(addAttachment)
    const [isUploading, setIsUploading] = useState(false)

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            const formData = new FormData()
            formData.append("file", file)

            const response = await fetch(`/api/transactions/attachments/upload?transactionId=${transactionId}`, {
                method: "POST",
                body: formData,
            })

            if (!response.ok) throw new Error("Upload failed")

            const data = await response.json()

            await addAttachmentMutation({
                id: data.id,
                transactionId,
                name: data.fileName,
                size: data.fileSize,
                type: data.fileType,
                path: data.filePath,
            })
            
            await invalidateQuery(getTransaction, { id: transactionId })
        } catch (error) {
            console.error("Error uploading attachment:", error)
            alert("Failed to upload attachment")
        } finally {
            setIsUploading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this attachment?")) return

        try {
            await deleteAttachmentMutation({ id })
            await invalidateQuery(getTransaction, { id: transactionId })
        } catch (error) {
            console.error("Error deleting attachment:", error)
            alert("Failed to delete attachment")
        }
    }

    return (
        <Section title={"Attachments"}
                 subtitle={"Documents and files associated with this transaction."}
                 actions={
                     <div className="flex items-center gap-2">
                         <label className={`cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                             <Paperclip className="mr-2 h-4 w-4" />
                             {isUploading ? "Uploading..." : "Add Attachment"}
                             <input type="file" className="hidden" onChange={handleUpload} disabled={isUploading} />
                         </label>
                     </div>
                 }>
            <div className="flex flex-col gap-4">
                {attachments.length === 0 ? (
                    <div className="text-sm text-muted-foreground italic">No attachments found for this transaction.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {attachments.map((attachment) => (
                            <div key={attachment.id} className="flex items-center justify-between p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <FileIcon className="h-8 w-8 text-primary shrink-0" />
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="text-sm font-medium truncate" title={attachment.name}>
                                            {attachment.name}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {(attachment.size / 1024).toFixed(1)} KB
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" asChild>
                                        <a href={`/api/transactions/attachments/download/${attachment.id}`} target="_blank" rel="noreferrer">
                                            <Download className="h-4 w-4" />
                                        </a>
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(attachment.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Section>
    )
}
