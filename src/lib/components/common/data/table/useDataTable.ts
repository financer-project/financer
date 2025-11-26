"use client"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useMemo } from "react"
import { buildPrismaWhere } from "./filters/prisma-filter-builder"
import { FilterConfig } from "./filters/types"

export type UseDataTableOptions<T, W> = {
    /** Optional dynamic filters configuration (used to build `where`) */
    filters?: FilterConfig<T>[]
    /** Optional search config (used to build `where`) */
    search?: {
        fields: string[]
        placeholder?: string
        paramKey?: string
    }
    /** Optional default page size when no `pageSize` is present in URL. Defaults to 25. */
    defaultPageSize?: number
}

export function useDataTable<T, W extends Record<string, unknown> = Record<string, unknown>>(
    options: UseDataTableOptions<T, W> = {}
) {
    const { filters, search, defaultPageSize = 25 } = options

    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()

    const page = Number(searchParams?.get("page") ?? 0)
    const pageSize = Number(searchParams?.get("pageSize") ?? defaultPageSize)

    const setPage = (newPage: number) => {
        const params = new URLSearchParams(searchParams ?? {})
        params.set("page", String(Math.max(0, newPage)))
        router.push(pathname + "?" + params.toString())
    }

    const setPageSize = (newSize: number) => {
        const params = new URLSearchParams(searchParams ?? {})
        params.set("pageSize", String(newSize))
        // Reset to first page when page size changes
        params.set("page", "0")
        router.push(pathname + "?" + params.toString())
    }

    const where = useMemo(() => {
        return buildPrismaWhere<T, W>({ searchParams, filters, search })
    }, [searchParams, filters, search])

    return {
        // Pagination
        page,
        pageSize,
        setPage,
        setPageSize,
        // Filtering/Search
        where,
        // raw search param helpers
        searchParams
    }
}
