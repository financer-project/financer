"use client"
import React from "react"
import { DateFilterConfig, FilterStrategy } from "./types"
import { Popover, PopoverContent, PopoverTrigger } from "@/src/lib/components/ui/popover"
import { Button } from "@/src/lib/components/ui/button"
import { Calendar } from "@/src/lib/components/ui/calendar"
import { endOfMonth, endOfYear, format, isValid, parseISO, startOfMonth, startOfYear, subDays } from "date-fns"
import withFormatters, { WithFormattersProps } from "@/src/lib/util/formatter/withFormatters"

type Range = { from?: Date; to?: Date }

function parseRange(val: string | null): Range {
    if (!val) return {}
    const [fromStr, toStr] = val.split("..")
    const from = fromStr ? parseISO(fromStr) : undefined
    const to = toStr ? parseISO(toStr) : undefined
    return {
        from: from && isValid(from) ? from : undefined,
        to: to && isValid(to) ? to : undefined
    }
}

function formatRange(r: Range): string | null {
    const fromStr = r.from ? format(r.from, "yyyy-MM-dd") : ""
    const toStr = r.to ? format(r.to, "yyyy-MM-dd") : ""
    const combined = `${fromStr}..${toStr}`
    // if both parts empty, no value
    return combined === ".." ? null : combined
}

function labelForRange(r: Range, placeholder: string, fmt: (d: Date) => string): string {
    if (!r.from && !r.to) return placeholder
    const from = r.from ? fmt(r.from) : ""
    const to = r.to ? fmt(r.to) : ""
    if (from && to) return `${from} → ${to}`
    if (from) return `${from} → …`
    return `… → ${to}`
}

const DateFilterComponent = <T, >({
                                      config,
                                      currentValue,
                                      onChange,
                                      formatters
                                  }: {
    config: DateFilterConfig<T>
    currentValue: string | null
    onChange: (val: string | null) => void
} & WithFormattersProps) => {
    const [open, setOpen] = React.useState(false)
    const [range, setRange] = React.useState<Range>(() => parseRange(currentValue))

    React.useEffect(() => {
        setRange(parseRange(currentValue))
    }, [currentValue])

    const apply = (r: Range) => {
        const val = formatRange(r)
        onChange(val)
        // keep popover open for custom range adjustments, but close on preset
    }

    const applyPreset = (preset: "thisMonth" | "lastMonth" | "last7" | "last30" | "thisYear") => {
        const today = new Date()
        let from: Date | undefined
        let to: Date | undefined
        switch (preset) {
            case "thisMonth":
                from = startOfMonth(today)
                to = endOfMonth(today)
                break
            case "lastMonth":
                // go to first day of this month, then back one day and take its month
                const firstThisMonth = startOfMonth(today)
                const lastPrevMonth = subDays(firstThisMonth, 1)
                from = startOfMonth(lastPrevMonth)
                to = endOfMonth(lastPrevMonth)
                break
            case "last7":
                to = today
                from = subDays(today, 6)
                break
            case "last30":
                to = today
                from = subDays(today, 29)
                break
            case "thisYear":
                from = startOfYear(today)
                to = endOfYear(today)
                break
        }
        const r = { from, to }
        setRange(r)
        onChange(formatRange(r))
        setOpen(false)
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="dashed">
                    {labelForRange(range, config.label, (d) => formatters.date.format(d))}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" align="start">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="secondary" onClick={() => applyPreset("thisMonth")}>
                            This month
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => applyPreset("lastMonth")}>
                            Last month
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => applyPreset("last7")}>
                            Last 7 days
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => applyPreset("last30")}>
                            Last 30 days
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => applyPreset("thisYear")}>
                            This year
                        </Button>
                    </div>
                    <div className={"flex flex-col items-center"}>
                        <Calendar
                            mode="range"
                            numberOfMonths={2}
                            selected={{ from: range.from, to: range.to }}
                            onSelect={(r) => {
                                const next: Range = { from: r?.from, to: r?.to }
                                setRange(next)
                            }}
                        />
                    </div>
                    <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => {
                            setRange({})
                            apply({})
                        }}>Clear</Button>
                        <Button size="sm" onClick={() => {
                            apply(range)
                            setOpen(false)
                        }}>Apply</Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}

export const DateFilterStrategy: FilterStrategy<any, DateFilterConfig<any>> = {
    // Wrap the component with formatter context so dates are displayed using the app's formatter
    Component: withFormatters(DateFilterComponent),
    getWhereClause: (config, value) => {
        const { from, to } = parseRange(value)
        const clause: any = {}
        if (from) clause.gte = from
        if (to) clause.lte = to
        return Object.keys(clause).length > 0 ? { [config.property]: clause } : {}
    }
}
