"use client"
import React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/src/lib/components/ui/button"
import { SearchIcon, X } from "lucide-react"
import { FilterConfig } from "./filters/types"
import { useDebounce } from "@/src/lib/hooks/use-debounce"
import { getFilterStrategy } from "./filters/registry"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/src/lib/components/ui/input-group"

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

    const searchKey = search?.paramKey ?? "q"
    const searchValueFromUrl = searchParams?.get(searchKey) ?? ""
    const [searchTerm, setSearchTerm] = React.useState<string>(searchValueFromUrl)
    const debouncedSearch = useDebounce(searchTerm, 400)

    // Determine which query keys are controlled by the toolbar (filters + search)
    const managedKeys = React.useMemo(() => {
        const set = new Set<string>()
        for (const f of filters) set.add(String(f.property))
        if (search) set.add(searchKey)
        return set
    }, [filters, search, searchKey])

    // Clear only managed keys (filters + search). Keep other params intact, reset page to 0.
    const clearAll = () => {
        const params = new URLSearchParams(searchParams?.toString())
        managedKeys.forEach((key) => params.delete(key))
        params.set("page", "0")
        const query = params.toString()
        if (query) router.push(`${pathname}?${query}`)
        else router.push(pathname || "/")
    }

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
    }, [searchValueFromUrl])

    if (!search && filters.length === 0) return null

    return (
        <div className="flex flex-wrap gap-2 items-center">
            {search && (
                <InputGroup className={"w-128"}>
                    <InputGroupAddon>
                        <SearchIcon/>
                    </InputGroupAddon>
                    <InputGroupInput
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={search.placeholder ?? "Search"} />
                </InputGroup>
            )}

            {filters.map((filter) => {
                const strategy = getFilterStrategy(filter.type)
                const key = filter.property as string

                const Comp = strategy.Component
                return (
                    <Comp
                        key={key}
                        config={filter}
                        currentValue={searchParams?.get(key) ?? null}
                        onChange={(val: string | null) => updateQuery(key, val)} />
                )
            })}

            {(() => {
                // Show reset only when at least one managed param has a value
                if (!searchParams) return false
                for (const key of managedKeys) {
                    const v = searchParams.get(key)
                    if (v && v.length > 0) return true
                }
                return false
            })() && (
                <Button variant="ghost" onClick={clearAll} size="sm">
                    Reset<X />
                </Button>
            )}
        </div>
    )
}
