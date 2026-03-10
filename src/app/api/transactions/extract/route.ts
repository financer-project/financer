import { NextRequest, NextResponse } from "next/server"
import { saveTempFile, cleanupExpiredTempFiles } from "@/src/lib/util/fileStorage"
import { extractInvoiceData } from "@/src/lib/model/transactions/services/extraction/invoiceExtractor"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif", "image/tiff"]
const TEMP_FILE_MAX_AGE_MS = 24 * 60 * 60 * 1000 // 24 hours

export async function POST(request: NextRequest) {
    try {
        // Opportunistically clean up expired temp files
        try {
            cleanupExpiredTempFiles(TEMP_FILE_MAX_AGE_MS)
        } catch (err) {
            console.warn("[extract] Cleanup failed:", err)
        }

        const formData = await request.formData()
        const file = formData.get("file")

        if (!file || !(file instanceof Blob)) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 })
        }

        const mimeType = file.type
        if (!mimeType || !ALLOWED_TYPES.some(t => mimeType === t || (t === "image/jpeg" && mimeType === "image/jpg"))) {
            return NextResponse.json({ error: "Invalid file type. Allowed: PDF and common image formats." }, { status: 400 })
        }

        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        if (buffer.length > MAX_FILE_SIZE) {
            return NextResponse.json({ error: "File too large. Maximum size is 10MB." }, { status: 400 })
        }

        const fileName = (file as File).name ?? `upload.${mimeType.split("/")[1]}`
        const tempFileId = crypto.randomUUID()

        saveTempFile(tempFileId, fileName, buffer, mimeType)

        const extraction = await extractInvoiceData(buffer, fileName, mimeType)

        return NextResponse.json({ tempFileId, fileName, extraction })
    } catch (err) {
        console.error("[extract] Error processing file:", err)
        return NextResponse.json({ error: "Failed to process file" }, { status: 500 })
    }
}
