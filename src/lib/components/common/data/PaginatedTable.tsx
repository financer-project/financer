"use client"
import React from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/src/lib/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/lib/components/ui/table"

const ITEMS_PER_PAGE = 100

interface PaginatedTableProps<T> {
    data: T[]
    columns: Array<{ name: string; render: (item: T) => React.ReactNode }>
    itemRoute: (item: T) => string
    hasMore: boolean
    count?: number
    createRoute?: string
}

export const PaginatedTable = <T, >({
                                        data,
                                        columns,
                                        itemRoute,
                                        hasMore,
                                        count,
                                        createRoute
                                    }: PaginatedTableProps<T>) => {
    const searchparams = useSearchParams()!
    const page = Number(searchparams.get("page")) || 0
    const router = useRouter()
    const pathname = usePathname()

    const goToPreviousPage = () => {
        const params = new URLSearchParams(searchparams)
        params.set("page", (page - 1).toString())
        // @ts-ignore
        router.push((pathname + "?" + params.toString()))
    }
    const goToNextPage = () => {
        const params = new URLSearchParams(searchparams)
        params.set("page", (page + 1).toString())
        // @ts-ignore
        router.push((pathname + "?" + params.toString()))
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-row justify-between items-center">
                {createRoute && (
                    <Button variant="outline" asChild>
                        <Link href={createRoute}>Create</Link>
                    </Button>
                )}
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        {columns.map((column, index) => (
                            <TableHead key={index}>{column.name}</TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((item, index) => (
                        <TableRow key={index}
                                  className={"cursor-pointer"}
                                  onClick={() => router.push(itemRoute(item) as  __next_route_internal_types__.RouteImpl<string>)}>
                            {columns.map((column, colIndex) => (
                                <TableCell key={colIndex}>{column.render(item)}</TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <div className="flex flex-row gap-4 justify-end">
                <Button variant="ghost" disabled={page === 0} onClick={goToPreviousPage}>
                    Previous
                </Button>
                <Button variant="ghost" disabled={!hasMore} onClick={goToNextPage}>
                    Next
                </Button>
            </div>
        </div>
    )
}