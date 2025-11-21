"use client"
import React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/lib/components/ui/select"
import { FilterStrategy, SelectFilterConfig } from "./types"
import { SelectField } from "@/src/lib/components/common/form/elements/SelectField"

const SelectFilterComponent = <T,>({ config, currentValue, onChange }: {
    config: SelectFilterConfig<T>,
    currentValue: string | null,
    onChange: (val: string | null) => void
}) => {
    // Multi-select branch uses the shared SelectField component
    if (config.multiSelect) {
        const selectedValues = React.useMemo(() => (currentValue ? currentValue.split(",") : []), [currentValue])
        return (
            <div className="min-w-[220px]">
                <SelectField<string>
                    multiple
                    placeholder={config.label}
                    options={config.options}
                    value={selectedValues}
                    onChange={(vals) => onChange(vals.length > 0 ? vals.join(",") : null)}
                />
            </div>
        )
    }

    // Single-select fallback uses Radix Select
    return (
        <Select value={currentValue ?? "ALL"} onValueChange={(val) => onChange(val === "ALL" ? null : val)}>
            <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={config.label} />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                {config.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                        {opt.render ? opt.render(opt.label) : opt.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}

export const SelectFilterStrategy: FilterStrategy<any, SelectFilterConfig<any>> = {
    Component: SelectFilterComponent,
    getWhereClause: (config, value) => {
        const values = value.split(",").filter(Boolean)
        if ((config.multiSelect && values.length >= 0) || values.length > 1) {
            // If multi-select, even a single value is fine inside `in: [...]`
            return values.length > 0 ? { [config.property]: { in: values } } : {}
        }
        return { [config.property]: { equals: value } }
    }
}
