"use client"
import React from "react"
import { Input } from "@/src/lib/components/ui/input"
import { FilterStrategy, StringFilterConfig } from "./types"
import { useDebounce } from "@/src/lib/hooks/use-debounce"

const StringFilterComponent = <T, >({ config, currentValue, onChange }: {
    config: StringFilterConfig<T>,
    currentValue: string | null,
    onChange: (val: string | null) => void
}) => {
    const [val, setVal] = React.useState(currentValue ?? "")
    const debouncedVal = useDebounce(val, 500)

    React.useEffect(() => {
        if (debouncedVal !== currentValue) {
            onChange(debouncedVal || null)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedVal])

    React.useEffect(() => {
        // keep local state in sync if URL changes externally
        setVal(currentValue ?? "")
    }, [currentValue])

    return (
        <div className="w-[200px]">
            <Input
                placeholder={config.label}
                value={val}
                onChange={(e) => setVal(e.target.value)}
            />
        </div>
    )
}

export const StringFilterStrategy: FilterStrategy<any, StringFilterConfig<any>> = {
    Component: StringFilterComponent,
    getWhereClause: (config, value) => ({
        [config.property]: { contains: value }
    })
}
