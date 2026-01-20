import { NextRequest, NextResponse } from "next/server"
import { readFile } from "@/src/lib/util/fileStorage"
import db from "@/src/lib/db"

export interface AttachmentDownloadError {
    error: string
}

interface RouteParams {
    params: Promise<{ attachmentId: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { attachmentId } = await params
        const forceDownload = request.nextUrl.searchParams.get("download") === "true"

        const attachment = await db.attachment.findUnique({
            where: { id: attachmentId }
        })

        if (!attachment) {
            return NextResponse.json<AttachmentDownloadError>(
                { error: "Attachment not found" },
                { status: 404 }
            )
        }

        const fileBuffer = readFile(attachment.path)
        const disposition = forceDownload ? "attachment" : "inline"

        return new NextResponse(new Uint8Array(fileBuffer), {
            headers: {
                "Content-Type": attachment.type,
                "Content-Disposition": `${disposition}; filename="${attachment.name}"`
            }
        })
    } catch (error) {
        console.error("Error downloading attachment:", error)
        return NextResponse.json<AttachmentDownloadError>(
            { error: "Failed to download attachment" },
            { status: 500 }
        )
    }
}
