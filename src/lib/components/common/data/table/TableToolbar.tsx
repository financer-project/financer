"use client"
import React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/src/lib/components/ui/button"
import { X } from "lucide-react"
import { FilterConfig } from "./filters/types"
import { Input } from "@/src/lib/components/ui/input"
import { useDebounce } from "@/src/lib/hooks/use-debounce"
import { getFilterStrategy } from "./filters/registry"

interface TableToolbarProps<T> {
    filters?: FilterConfig<T>[]
    search?: {
        fields: string[]
        placeholder?: string
        paramKey?: string
    }
}

export const TableToolbar = <T, >({ filters = [], search }: TableToolbarProps<T>) => {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const updateQuery = (key: string, value: string | null) => {
        const params = new URLSearchParams(searchParams?.toString())
        if (value) params.set(key, value)
        else params.delete(key)
        params.set("page", "0")
        router.push(`${pathname}?${params.toString()}`)
    }

    const clearAll = () => router.push(pathname || "/")

    const searchKey = search?.paramKey ?? "q"
    const searchValueFromUrl = searchParams?.get(searchKey) ?? ""
    const [searchTerm, setSearchTerm] = React.useState<string>(searchValueFromUrl)
    const debouncedSearch = useDebounce(searchTerm, 400)

    React.useEffect(() => {
        // Push debounced search term to URL
        if (search) {
            updateQuery(searchKey, debouncedSearch?.trim() ? debouncedSearch.trim() : null)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch])

    React.useEffect(() => {
        // keep local state in sync when URL changes externally
        setSearchTerm(searchValueFromUrl)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchValueFromUrl])

    if (!search && filters.length === 0) return null

    return (
        <div className="flex flex-wrap gap-2 items-center">
            {search && (
                <div className="w-[240px]">
                    <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={search.placeholder ?? "Search"}
                    />
                </div>
            )}

            {filters.map((filter) => {
                const strategy = getFilterStrategy(filter.type)
                const key = filter.property as string

                const Comp = strategy.Component as any
                return (
                    <Comp
                        key={key}
                        config={filter as any}
                        currentValue={searchParams?.get(key) ?? null}
                        onChange={(val: string | null) => updateQuery(key, val)} />
                )
            })}

            {(searchParams?.toString().length ?? 0) > 0 && (
                <Button variant="ghost" onClick={clearAll} size="sm">
                    Reset<X />
                </Button>
            )}
        </div>
    )
}
