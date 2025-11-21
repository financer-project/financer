"use client"
import React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/src/lib/components/ui/button"
import { cn } from "@/src/lib/util/utils"

export const TablePagination = ({ hasMore }: { hasMore: boolean }) => {
    const searchParams = useSearchParams()
    const page = Number(searchParams?.get("page") ?? 0)
    const router = useRouter()
    const pathname = usePathname()

    const goToPreviousPage = () => {
        const params = new URLSearchParams(searchParams ?? {})
        params.set("page", (page - 1).toString())
        router.push(pathname + "?" + params.toString())
    }

    const goToNextPage = () => {
        const params = new URLSearchParams(searchParams ?? {})
        params.set("page", (page + 1).toString())
        router.push(pathname + "?" + params.toString())
    }

    return (
        <div className={cn(hasMore || page > 0 ? "flex flex-row gap-4 justify-end" : "hidden")}> 
            <Button variant="ghost" disabled={page === 0} onClick={goToPreviousPage}>
                Previous
            </Button>
            <Button variant="ghost" disabled={!hasMore} onClick={goToNextPage}>
                Next
            </Button>
        </div>
    )
}
