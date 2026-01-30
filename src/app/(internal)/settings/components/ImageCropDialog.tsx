"use client"

import { useCallback, useState } from "react"
import Cropper, { Area } from "react-easy-crop"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/src/lib/components/ui/dialog"
import { Button } from "@/src/lib/components/ui/button"
import { Slider } from "@/src/lib/components/ui/slider"
import { Loader2, ZoomIn, ZoomOut } from "lucide-react"

interface ImageCropDialogProps {
    open: boolean
    imageSrc: string
    onClose: () => void
    onCropComplete: (croppedBlob: Blob) => void
}

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
    const image = new Image()
    image.src = imageSrc

    await new Promise((resolve) => {
        image.onload = resolve
    })

    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    if (!ctx) {
        throw new Error("Could not get canvas context")
    }

    // Set canvas size to the cropped area
    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height

    // Draw the cropped image
    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    )

    // Convert to blob
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) {
                    resolve(blob)
                } else {
                    reject(new Error("Canvas is empty"))
                }
            },
            "image/jpeg",
            0.9
        )
    })
}

export function ImageCropDialog({ open, imageSrc, onClose, onCropComplete }: ImageCropDialogProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)

    const onCropChange = useCallback((newCrop: { x: number; y: number }) => {
        setCrop(newCrop)
    }, [])

    const onZoomChange = useCallback((newZoom: number) => {
        setZoom(newZoom)
    }, [])

    const onCropAreaChange = useCallback((_: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }, [])

    const handleSave = async () => {
        if (!croppedAreaPixels) return

        setIsProcessing(true)
        try {
            const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels)
            onCropComplete(croppedBlob)
        } catch (error) {
            console.error("Error cropping image:", error)
        } finally {
            setIsProcessing(false)
        }
    }

    const handleClose = () => {
        setCrop({ x: 0, y: 0 })
        setZoom(1)
        onClose()
    }

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
            <DialogContent className={"max-w-md"}>
                <DialogHeader>
                    <DialogTitle>Crop Profile Picture</DialogTitle>
                    <DialogDescription>
                        Drag to reposition and use the slider to zoom in or out.
                    </DialogDescription>
                </DialogHeader>

                <div className={"relative h-64 w-full bg-muted rounded-lg overflow-hidden"}>
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        cropShape={"round"}
                        showGrid={false}
                        onCropChange={onCropChange}
                        onZoomChange={onZoomChange}
                        onCropComplete={onCropAreaChange}
                    />
                </div>

                <div className={"flex items-center gap-3"}>
                    <ZoomOut className={"h-4 w-4 text-muted-foreground"} />
                    <Slider
                        value={[zoom]}
                        min={1}
                        max={3}
                        step={0.1}
                        onValueChange={(values) => setZoom(values[0])}
                        className={"flex-1"}
                    />
                    <ZoomIn className={"h-4 w-4 text-muted-foreground"} />
                </div>

                <DialogFooter>
                    <Button variant={"outline"} onClick={handleClose} disabled={isProcessing}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isProcessing}>
                        {isProcessing && <Loader2 className={"h-4 w-4 animate-spin"} />}
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
