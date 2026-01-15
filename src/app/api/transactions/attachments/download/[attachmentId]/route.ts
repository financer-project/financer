import { NextRequest, NextResponse } from "next/server"
import { readFile } from "@/src/lib/util/fileStorage"
import db from "@/src/lib/db"

export async function GET(request: NextRequest, { params }: { params: Promise<{ attachmentId: string }> }) {
    try {
        const { attachmentId } = await params;
        const attachment = await db.attachment.findUnique({
            where: { id: attachmentId }
        })

        if (!attachment) {
            return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
        }

        const fileBuffer = readFile(attachment.path)

        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": attachment.type,
                "Content-Disposition": `inline; filename="${attachment.name}"`
            }
        })
    } catch (error) {
        console.error('Error downloading attachment:', error);
        return NextResponse.json(
            { error: 'Failed to download attachment' }, 
            { status: 500 }
        );
    }
}
