import { NextRequest, NextResponse } from "next/server"
import { saveAttachmentFile } from "@/src/lib/util/fileStorage"
import db from "@/src/lib/db"

export interface AttachmentUploadResponse {
    id: string
    name: string
    size: number
    type: string
}

export interface AttachmentUploadError {
    error: string
}

export async function POST(request: NextRequest) {
    try {
        const transactionId = request.nextUrl.searchParams.get("transactionId")

        if (!transactionId) {
            return NextResponse.json<AttachmentUploadError>(
                { error: "Transaction ID is required" },
                { status: 400 }
            )
        }

        // Verify the transaction exists
        const transaction = await db.transaction.findUnique({
            where: { id: transactionId }
        })

        if (!transaction) {
            return NextResponse.json<AttachmentUploadError>(
                { error: "Transaction not found" },
                { status: 404 }
            )
        }

        const formData = await request.formData()
        const file = formData.get("file") as File

        if (!file) {
            return NextResponse.json<AttachmentUploadError>(
                { error: "File is required" },
                { status: 400 }
            )
        }

        const buffer = Buffer.from(await file.arrayBuffer())

        // Create the attachment record in the database (generates ID automatically)
        const attachment = await db.attachment.create({
            data: {
                name: file.name,
                size: file.size,
                type: file.type,
                path: "", // Will be updated after file is saved
                transaction: {
                    connect: { id: transactionId }
                }
            }
        })

        // Save the file to the filesystem using the generated ID
        const filePath = await saveAttachmentFile(transactionId, attachment.id, file.name, buffer)

        // Update the attachment record with the file path
        const updatedAttachment = await db.attachment.update({
            where: { id: attachment.id },
            data: { path: filePath }
        })

        return NextResponse.json<AttachmentUploadResponse>({
            id: updatedAttachment.id,
            name: updatedAttachment.name,
            size: updatedAttachment.size,
            type: updatedAttachment.type
        })
    } catch (error) {
        console.error("Error uploading attachment:", error)
        return NextResponse.json<AttachmentUploadError>(
            { error: "Failed to upload attachment" },
            { status: 500 }
        )
    }
}
