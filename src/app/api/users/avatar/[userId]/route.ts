import { NextRequest, NextResponse } from "next/server"
import { readFile } from "@/src/lib/util/fileStorage"
import db from "@/src/lib/db"
import path from "path"

export interface AvatarDownloadError {
    error: string
}

interface RouteParams {
    params: Promise<{ userId: string }>
}

const CONTENT_TYPES: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp"
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { userId } = await params

        const user = await db.user.findUnique({
            where: { id: userId },
            select: { avatarPath: true }
        })

        if (!user?.avatarPath) {
            return NextResponse.json<AvatarDownloadError>({ error: "Avatar not found" }, { status: 404 })
        }

        const fileBuffer = readFile(user.avatarPath)
        const extension = path.extname(user.avatarPath).toLowerCase()

        return new NextResponse(new Uint8Array(fileBuffer), {
            headers: {
                "Content-Type": CONTENT_TYPES[extension] || "image/jpeg",
                "Cache-Control": "public, max-age=31536000, immutable"
            }
        })
    } catch (error) {
        console.error("Error serving avatar:", error)
        return NextResponse.json<AvatarDownloadError>({ error: "Failed to serve avatar" }, { status: 500 })
    }
}
