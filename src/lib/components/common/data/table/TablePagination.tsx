"use client"
import React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/src/lib/components/ui/button"
import { cn } from "@/src/lib/util/utils"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/lib/components/ui/select"

export const TablePagination = ({ hasMore, pageSize = 25, count }: {
    hasMore: boolean,
    pageSize?: number,
    count: number
}) => {
    const searchParams = useSearchParams()
    const page = Number(searchParams?.get("page") ?? 0)
    const router = useRouter()
    const pathname = usePathname()
    const currentPageSize = Number(searchParams?.get("pageSize") ?? pageSize)
    const totalPages = Math.ceil(count / currentPageSize)

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

    const goToFirstPage = () => {
        const params = new URLSearchParams(searchParams ?? {})
        params.set("page", "0")
        router.push(pathname + "?" + params.toString())
    }

    const goToLastPage = () => {
        const params = new URLSearchParams(searchParams ?? {})
        const lastIndex = Math.max(Math.ceil(count / currentPageSize) - 1, 0)
        params.set("page", lastIndex.toString())
        router.push(pathname + "?" + params.toString())
    }

    const onChangePageSize = (value: string) => {
        const params = new URLSearchParams(searchParams ?? {})
        params.set("pageSize", value)
        // Reset to first page when page size changes
        params.set("page", "0")
        router.push(pathname + "?" + params.toString())
    }

    return (
        <div className={cn("flex flex-row gap-4 justify-between")}>
            <div>
                <span></span>
            </div>
            <div className={"flex gap-12 items-center"}>
                <div className={"flex gap-4 items-center"}>
                    <span className={"text-sm no-wrap"}>Rows per page:</span>
                    <Select value={String(currentPageSize)} onValueChange={onChangePageSize}>
                        <SelectTrigger className={"w-32"}>
                            <SelectValue placeholder={"Page size"} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={"10"}>10 rows</SelectItem>
                            <SelectItem value={"25"}>25 rows</SelectItem>
                            <SelectItem value={"50"}>50 rows</SelectItem>
                            <SelectItem value={"100"}>100 rows</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <span className={"text-sm"}>Page {page + 1} of {totalPages}</span>

                <div className={"flex gap-2"}>
                    <Button variant="outline" size={"sm"} disabled={page === 0} onClick={goToFirstPage}>
                        <ChevronsLeft />
                    </Button>
                    <Button variant="outline" size={"sm"} disabled={page === 0} onClick={goToPreviousPage}>
                        <ChevronLeft />
                    </Button>
                    <Button variant="outline" size={"sm"} disabled={!hasMore} onClick={goToNextPage}>
                        <ChevronRight />
                    </Button>
                    <Button variant="outline" size={"sm"} disabled={!hasMore} onClick={goToLastPage}>
                        <ChevronsRight />
                    </Button>
                </div>
            </div>
        </div>
    )
}
