"use client"
import React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/lib/components/ui/table"
import { useIsMobile } from "@/src/lib/hooks/use-mobile"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/lib/components/ui/card"
import DataItem from "@/src/lib/components/common/data/DataItem"
import { DataItemContainer } from "@/src/lib/components/common/data/DataItemContainer"
import { useRouter } from "next/navigation"

export interface TableColumn<T> {
    key?: string
    name: string
    render: (item: T) => React.ReactNode
    isKey?: boolean
}

export const TableContent = <T,>({ columns, data, itemRoute }: {
    columns: TableColumn<T>[]
    data: T[]
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
                                {columns.find((column) => column.isKey)?.render(item)}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <DataItemContainer>
                                {columns
                                    .filter((column) => !column.isKey)
                                    .map((column) => (
                                        <DataItem key={column.key || column.name} label={column.name} data={column.render(item)} />
                                    ))}
                            </DataItemContainer>
                        </CardContent>
                    </Card>
                ))
            }
        </>
    )
}
