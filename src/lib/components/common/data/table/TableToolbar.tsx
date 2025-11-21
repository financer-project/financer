"use client"
import React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/src/lib/components/ui/button"
import { X } from "lucide-react"
import { FilterConfig } from "./filters/types"
import { getFilterStrategy } from "./filters/registry"

interface TableToolbarProps<T> {
    filters?: FilterConfig<T>[]
}

export const TableToolbar = <T, >({ filters = [] }: TableToolbarProps<T>) => {
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

    if (filters.length === 0) return null

    return (
        <div className="flex flex-wrap gap-2 items-center">
            {}

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
