"use client"

import { useRef, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/src/lib/components/ui/avatar"
import { Button } from "@/src/lib/components/ui/button"
import { Camera, Loader2, Trash2 } from "lucide-react"
import { ImageCropDialog } from "./ImageCropDialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/lib/components/ui/card"

interface AvatarUploadProps {
    userId: string
    firstName: string
    lastName: string
    hasAvatar: boolean
    onUpload: () => void
    onDelete: () => Promise<void>
}

export function AvatarUpload({ userId, firstName, lastName, hasAvatar, onUpload, onDelete }: AvatarUploadProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [avatarKey, setAvatarKey] = useState(Date.now())
    const [cropDialogOpen, setCropDialogOpen] = useState(false)
    const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    const avatarUrl = hasAvatar ? `/api/users/avatar/${userId}?v=${avatarKey}` : undefined

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        // Create a data URL to pass to the crop dialog
        const reader = new FileReader()
        reader.onload = () => {
            setSelectedImageSrc(reader.result as string)
            setCropDialogOpen(true)
        }
        reader.readAsDataURL(file)

        // Reset the input so the same file can be selected again
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    const handleCropComplete = async (croppedBlob: Blob) => {
        setCropDialogOpen(false)
        setSelectedImageSrc(null)
        setIsUploading(true)

        try {
            const formData = new FormData()
            formData.append("file", croppedBlob, "avatar.jpg")

            const response = await fetch("/api/users/avatar/upload", {
                method: "POST",
                body: formData
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Upload failed")
            }

            setAvatarKey(Date.now())
            onUpload()
        } catch (error) {
            console.error("Upload error:", error)
            alert(error instanceof Error ? error.message : "Upload failed")
        } finally {
            setIsUploading(false)
        }
    }

    const handleCropDialogClose = () => {
        setCropDialogOpen(false)
        setSelectedImageSrc(null)
    }

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            await onDelete()
            setAvatarKey(Date.now())
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <>
            <Card >
                <CardHeader>
                    <CardTitle>Avatar</CardTitle>
                    <CardDescription>Upload a new avatar or delete the current one</CardDescription>
                </CardHeader>
                <CardContent className={"flex flex-row gap-4 items-center pt-0!"}>
                    <Avatar className={"h-32 w-32"}>
                        <AvatarImage src={avatarUrl} alt={firstName} />
                        <AvatarFallback className={"text-3xl"}>{initials}</AvatarFallback>
                    </Avatar>

                    <div className={"flex flex-col gap-2 justify-center w-full"}>
                        <input
                            ref={fileInputRef}
                            type={"file"}
                            accept={"image/jpeg,image/png,image/gif,image/webp"}
                            className={"hidden"}
                            onChange={handleFileSelect} />

                        <Button
                            type={"button"}
                            variant={"outline"}
                            size={"sm"}
                            disabled={isUploading}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {isUploading ? (
                                <Loader2 className={"h-4 w-4 animate-spin"} />
                            ) : (
                                <Camera className={"h-4 w-4"} />
                            )}
                            {hasAvatar ? "Change" : "Upload"}
                        </Button>

                        {hasAvatar && (
                            <Button
                                type={"button"}
                                variant={"ghost"}
                                size={"sm"}
                                disabled={isDeleting}
                                onClick={handleDelete}
                                className={"text-destructive hover:text-destructive"}
                            >
                                {isDeleting ? (
                                    <Loader2 className={"h-4 w-4 animate-spin"} />
                                ) : (
                                    <Trash2 className={"h-4 w-4"} />
                                )}
                                Remove
                            </Button>
                        )}

                        <p className={"text-xs text-muted-foreground text-center"}>
                            Max 5MB
                        </p>
                    </div>
                </CardContent>
            </Card>

            {selectedImageSrc && (
                <ImageCropDialog
                    open={cropDialogOpen}
                    imageSrc={selectedImageSrc}
                    onClose={handleCropDialogClose}
                    onCropComplete={handleCropComplete}
                />
            )}
        </>
    )
}
