"use client"
import React from "react"
import Link from "next/link"
import { Button } from "@/src/lib/components/ui/button"
import { Plus } from "lucide-react"
import { TableColumn, TableContent } from "./TableContent"
import { TablePagination } from "./TablePagination"
import { TableToolbar } from "./TableToolbar"
import { FilterConfig } from "./filters/types"

// Re-export types for consumers
export type { TableColumn }

export interface DataTableProps<T> {
    data: T[]
    columns: Array<TableColumn<T>>
    itemRoute?: (item: T) => string
    hasMore: boolean
    createRoute?: string
    filters?: FilterConfig<T>[]
    /** Total item count across all pages (for pagination). If omitted, falls back to data.length */
    count: number
    /**
     * Fuzzy search configuration. When provided, a search input is rendered in the toolbar
     * and the value is exposed via URL query param (default key: "q").
     */
    search?: {
        /** List of fields to search across. Supports dotted paths for relations, e.g. "account.name" */
        fields: string[]
        /** Optional placeholder for the search input */
        placeholder?: string
        /** Optional URL param key; defaults to "q" */
        paramKey?: string
    }
}

export const DataTable = <T,>({
                                   data,
                                   columns,
                                   itemRoute,
                                   hasMore,
                                   createRoute,
                                   filters,
                                   search,
                                   count
                               }: DataTableProps<T>) => {

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                {/* 1. Dynamic Filter Toolbar */}
                <TableToolbar filters={filters} search={search} />

                {createRoute && (
                    <div className="flex flex-row justify-end items-center">
                        <Button variant={"outline"} asChild>
                            <Link href={{ pathname: createRoute }}><Plus /> Create</Link>
                        </Button>
                    </div>
                )}
            </div>

            {/* 2. Main Content */}
            <TableContent columns={columns} data={data} itemRoute={itemRoute} />

            {/* 3. Pagination */}
            <TablePagination hasMore={hasMore} count={count} />
        </div>
    )
}
