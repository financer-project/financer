"use client"

import React, { useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/src/lib/components/ui/button"
import { ScanLine } from "lucide-react"
import { toast } from "sonner"

export function InvoiceUploadButton() {
    const router = useRouter()
    const inputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Reset input so the same file can be re-selected
        e.target.value = ""

        const toastId = toast.loading("Processing invoice...")

        try {
            const formData = new FormData()
            formData.append("file", file)

            const response = await fetch("/api/transactions/extract", {
                method: "POST",
                body: formData
            })

            if (!response.ok) {
                const { error } = await response.json()
                throw new Error(error ?? "Upload failed")
            }

            const { tempFileId, fileName, extraction } = await response.json()

            toast.dismiss(toastId)

            const params = new URLSearchParams()
            params.set("tempFileId", tempFileId)
            params.set("tempFileName", fileName)
            if (extraction.name) params.set("name", extraction.name)
            if (extraction.amount !== null) params.set("amount", String(Math.round(extraction.amount * 100) / 100))
            if (extraction.type) params.set("type", extraction.type)
            // Use date-only string (YYYY-MM-DD) to avoid timezone shifts when reconstructing
            if (extraction.valueDate) params.set("valueDate", extraction.valueDate.slice(0, 10))
            if (extraction.description) params.set("description", extraction.description)
            if (extraction.counterpartyName) params.set("counterpartyName", extraction.counterpartyName)

            router.push(`/transactions/new?${params.toString()}`)
        } catch (err: unknown) {
            toast.dismiss(toastId)
            const message = err instanceof Error ? err.message : "Failed to process invoice"
            toast.error(message)
        }
    }

    return (
        <>
            <input
                ref={inputRef}
                type="file"
                accept="image/*,application/pdf"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
            />
            <Button variant="outline" onClick={() => inputRef.current?.click()}>
                <ScanLine className="h-4 w-4" />
                Upload Invoice
            </Button>
        </>
    )
}
