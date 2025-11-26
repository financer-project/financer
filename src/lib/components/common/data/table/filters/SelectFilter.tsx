"use client"
import React from "react"
import { FilterStrategy, SelectFilterConfig } from "./types"
import { SelectField } from "@/src/lib/components/common/form/elements/SelectField"

const SelectFilterComponent = <T, >({ config, currentValue, onChange }: {
    config: SelectFilterConfig<T>,
    currentValue: string | null,
    onChange: (val: string | null) => void
}) => {
    const selectedValues = React.useMemo(() => (currentValue ? currentValue.split(",") : []), [currentValue])

    if (config.multiSelect) {
        return (
            <div>
                <SelectField<string>
                    multiple
                    placeholder={config.label}
                    options={config.options}
                    value={selectedValues}
                    onChange={(vals) => onChange(vals.length > 0 ? vals.join(",") : null)}
                    className={"border border-dashed shadow-none text-foreground font-medium"}
                    keepPlaceholder={true}
                    disableClearButton={true} />
            </div>
        )
    } else {
        return (
            <div>
                <SelectField<string>
                    placeholder={config.label}
                    options={config.options}
                    value={currentValue}
                    onChange={(newValue) => onChange(newValue)}
                    className={"border border-dashed shadow-none text-foreground font-medium"}
                    keepPlaceholder={true}
                    disableClearButton={true} />
            </div>
        )
    }
}

type StrategyComponent<C> = React.FC<{ config: C; currentValue: string | null; onChange: (val: string | null) => void }>

export const SelectFilterStrategy: FilterStrategy<unknown, SelectFilterConfig<unknown>> = {
    Component: SelectFilterComponent as unknown as StrategyComponent<SelectFilterConfig<unknown>>,
    getWhereClause: (config, value) => {
        const values = value.split(",").filter(Boolean)
        if ((config.multiSelect && values.length >= 0) || values.length > 1) {
            // If multi-select, even a single value is fine inside `in: [...]`
            return values.length > 0 ? { [config.property]: { in: values } } : {}
        }
        return { [config.property]: { equals: value } }
    }
}
