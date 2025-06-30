"use client"
import React from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/src/lib/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/lib/components/ui/table"
import { cn } from "@/src/lib/util/utils"
import { Plus } from "lucide-react"

export interface TableColumn<T> {
    name: string,
    render: (item: T) => React.ReactNode
}

interface PaginatedTableProps<T> {
    data: T[]
    columns: Array<TableColumn<T>>
    itemRoute?: (item: T) => string
    hasMore?: boolean
    createRoute?: string
}

export const PaginatedTable = <T, >({
                                        data,
                                        columns,
                                        itemRoute,
                                        hasMore,
                                        createRoute
                                    }: PaginatedTableProps<T>) => {
    const searchParams = useSearchParams()
    const page = Number(searchParams?.get("page") ?? 0)
    const router = useRouter()
    const pathname = usePathname()

    const goToPreviousPage = () => {
        const params = new URLSearchParams(searchParams ?? {})
        params.set("page", (page - 1).toString())
        router.push(pathname + "?" + params.toString() as __next_route_internal_types__.RouteImpl<string>)
    }

    const goToNextPage = () => {
        const params = new URLSearchParams(searchParams ?? {})
        params.set("page", (page + 1).toString())
        router.push(pathname + "?" + params.toString() as __next_route_internal_types__.RouteImpl<string>)
    }

    return (
        <div className="flex flex-col gap-4">
            {createRoute && (
                <div className="flex flex-row justify-end items-center">
                    <Button variant={"outline"} asChild>
                        <Link href={{ pathname: createRoute }}><Plus /> Create</Link>
                    </Button>
                </div>
            )}
            <Table>
                <TableHeader>
                    <TableRow>
                        {columns.map((column, index) => (
                            <TableHead key={`th-${index}`}>{column.name}</TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((item, index) => (
                        <TableRow key={`tr-${index}`}
                                  className={"cursor-pointer"}
                                  onClick={() => itemRoute && router.push(itemRoute(item) as __next_route_internal_types__.RouteImpl<string>)}>
                            {columns.map((column, colIndex) => (
                                <TableCell key={`td-${colIndex}`}>{column.render(item)}</TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <div className={cn(hasMore ? "flex flex-row gap-4 justify-end" : "hidden")}>
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