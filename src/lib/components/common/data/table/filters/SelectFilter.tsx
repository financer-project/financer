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
                    className={"border border-dashed shadow-xs font-medium"}
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
                    className={"border border-dashed shadow-xs"}
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
        // Handle multi and single select, with special support for string "null" meaning actual NULL
        const values = value.split(",").filter((v) => v !== "")

        if (config.multiSelect) {
            // Map the special token "null" to a real null and build appropriate clause
            const mapped = values.map((v) => (v === "null" ? null : v))
            const nonNullValues = mapped.filter((v): v is string => v !== null)
            const hasNull = mapped.some((v) => v === null)

            if (hasNull && nonNullValues.length > 0) {
                return {
                    OR: [
                        { [config.property]: { in: nonNullValues } },
                        { [config.property]: { equals: null } }
                    ]
                }
            }

            if (hasNull) {
                return { [config.property]: { equals: null } }
            }

            return nonNullValues.length > 0 ? { [config.property]: { in: nonNullValues } } : {}
        }

        // single-select
        if (value === "null") {
            return { [config.property]: { equals: null } }
        }
        return { [config.property]: { equals: value } }
    }
}
