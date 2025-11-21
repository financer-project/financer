import { ReactNode } from "react"

// 1. Configuration Types (What you write in @file:CounterpartiesList.tsx)
export type FilterType = "string" | "select" | "date"

export interface BaseFilterConfig<T> {
    property: keyof T | string
    label: string
    type: FilterType
}

export interface StringFilterConfig<T> extends BaseFilterConfig<T> {
    type: "string"
}

export interface SelectFilterConfig<T> extends BaseFilterConfig<T> {
    type: "select"
    options: { label: string; value: string; render?: (label: string) => ReactNode }[]
    multiSelect?: boolean
}

export interface DateFilterConfig<T> extends BaseFilterConfig<T> {
    type: "date"
}

export type FilterConfig<T> = StringFilterConfig<T> | SelectFilterConfig<T> | DateFilterConfig<T>

// 2. Strategy Interface (The implementation contract)
export interface FilterStrategy<T, C extends BaseFilterConfig<T>> {
    /**
     * Renders the UI component for the filter.
     */
    Component: React.FC<{ config: C; currentValue: string | null; onChange: (val: string | null) => void }>

    /**
     * Generates the Prisma Where clause fragment.
     */
    getWhereClause: (config: C, value: string) => any
}
