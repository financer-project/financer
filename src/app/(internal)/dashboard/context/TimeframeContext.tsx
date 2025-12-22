"use client"

import React, { createContext, ReactNode, useContext, useMemo, useState } from "react"
import { DateTime } from "luxon"

// Define the timeframe type
export type Timeframe = {
    startDate: DateTime
    endDate?: DateTime
}

// Define the timeframe options
export type TimeframeOption = {
    label: string
    value: Timeframe
}

// Default timeframe options
export const defaultTimeframeOptions: TimeframeOption[] = [
    { label: "This Week", value: { startDate: DateTime.now().startOf("week") } },
    { label: "This Month", value: { startDate: DateTime.now().startOf("month") } },
    { label: "Last 3 Months", value: { startDate: DateTime.now().minus({ months: 3 }) } },
    { label: "This Quarter", value: { startDate: DateTime.now().startOf("quarter") } },
    { label: "This Year", value: { startDate: DateTime.now().startOf("year") } },
    {
        label: "Last Year",
        value: {
            startDate: DateTime.now().minus({ years: 1 }).startOf("year"),
            endDate: DateTime.now().minus({ years: 1 }).endOf("year")
        }
    }
]

// Context type definition
type TimeframeContextType = {
    timeframe: Timeframe
    setTimeframe: (timeframe: Timeframe) => void
    timeframeOptions: TimeframeOption[]
}

// Create the context with a default value
const TimeframeContext = createContext<TimeframeContextType | undefined>(
    undefined
)

// Provider component
export const TimeframeProvider: React.FC<{
    children: ReactNode
    initialTimeframe?: Timeframe
    options?: TimeframeOption[]
}> = ({
          children,
          initialTimeframe = defaultTimeframeOptions[2].value, // Default to "Last 3 Months"
          options = defaultTimeframeOptions
      }) => {
    const [timeframe, setTimeframe] = useState<Timeframe>(initialTimeframe)

    // Memoize the context value to avoid unnecessary re-renders
    const value = useMemo(
        () => ({
            timeframe,
            setTimeframe,
            timeframeOptions: options
        }),
        [timeframe, options]
    )

    return (
        <TimeframeContext.Provider value={value}>
            {children}
        </TimeframeContext.Provider>
    )
}

// Hook to use the timeframe context
export const useTimeframe = (): TimeframeContextType => {
    const context = useContext(TimeframeContext)
    if (context === undefined) {
        throw new Error("useTimeframe must be used within a TimeframeProvider")
    }
    return context
}