"use client"

import React from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/src/lib/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/lib/components/ui/table"
import { cn } from "@/src/lib/util/utils"
import { Plus } from "lucide-react"
import { useIsMobile } from "@/src/lib/hooks/use-mobile"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/lib/components/ui/card"
import DataItem from "@/src/lib/components/common/data/DataItem"

export interface TableColumn<T> {
    name: string,
    render: (item: T) => React.ReactNode,
    key?: boolean,

}

interface DataTable<T> {
    data: T[]
    columns: Array<TableColumn<T>>
    itemRoute?: (item: T) => string
    hasMore: boolean
    createRoute?: string
}

export const DataTable = <T, >({
                                   data,
                                   columns,
                                   itemRoute,
                                   hasMore,
                                   createRoute
                               }: DataTable<T>) => {
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
        <div className="flex flex-col gap-4">
            {createRoute && (
                <div className="flex flex-row justify-end items-center">
                    <Button variant={"outline"} asChild>
                        <Link href={{ pathname: createRoute }}><Plus /> Create</Link>
                    </Button>
                </div>
            )}

            <TableContent columns={columns} data={data} itemRoute={itemRoute} />

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

const TableContent = <T, >({ columns, data, itemRoute }: {
    columns: TableColumn<T>[],
    data: any[],
    itemRoute?: (item: T) => string
}) => {
    const isMobile = useIsMobile()
    const router = useRouter()


    return (
        <>
            {!isMobile
                ? <Table>
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
                                      onClick={() => itemRoute && router.push(itemRoute(item))}>
                                {columns.map((column, colIndex) => (
                                    <TableCell key={`td-${colIndex}`}>{column.render(item)}</TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                : data.map((item, index) => (
                    <Card
                        key={`mobile-item-${index}`}
                        onClick={() => itemRoute && router.push(itemRoute(item))}>
                        <CardHeader>
                            <CardTitle className={"text-lg"}>
                                {columns.find((column) => column.key)?.render(item)}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className={"grid grid-cols-2 gap-2"}>
                            {columns
                                .filter((column) => !column.key)
                                .map((column) => (
                                    <DataItem label={column.name} data={column.render(item)} />
                                ))}
                        </CardContent>
                    </Card>
                ))
            }
        </>
    )
}