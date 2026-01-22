import { NextRequest, NextResponse } from "next/server"
import { saveUserAvatar } from "@/src/lib/util/fileStorage"
import db from "@/src/lib/db"
import { invoke } from "@/src/app/blitz-server"
import getCurrentUser from "@/src/lib/model/auth/queries/getCurrentUser"

export interface AvatarUploadResponse {
    success: boolean
    avatarUrl: string
}

export interface AvatarUploadError {
    error: string
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(request: NextRequest) {
    try {
        // Get authenticated user
        const user = await invoke(getCurrentUser, null)
        if (!user) {
            return NextResponse.json<AvatarUploadError>({ error: "Unauthorized" }, { status: 401 })
        }

        const formData = await request.formData()
        const file = formData.get("file") as File

        if (!file) {
            return NextResponse.json<AvatarUploadError>({ error: "File is required" }, { status: 400 })
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json<AvatarUploadError>(
                { error: "Invalid file type. Allowed: JPEG, PNG, GIF, WebP" },
                { status: 400 }
            )
        }

        // Validate file size
        if (file.size > MAX_SIZE) {
            return NextResponse.json<AvatarUploadError>(
                { error: "File too large. Maximum size: 5MB" },
                { status: 400 }
            )
        }

        const buffer = Buffer.from(await file.arrayBuffer())

        // Save avatar file
        const avatarPath = saveUserAvatar(user.id, file.name, buffer)

        // Update user record
        await db.user.update({
            where: { id: user.id },
            data: { avatarPath }
        })

        return NextResponse.json<AvatarUploadResponse>({
            success: true,
            avatarUrl: `/api/users/avatar/${user.id}`
        })
    } catch (error) {
        console.error("Error uploading avatar:", error)
        return NextResponse.json<AvatarUploadError>({ error: "Failed to upload avatar" }, { status: 500 })
    }
}
