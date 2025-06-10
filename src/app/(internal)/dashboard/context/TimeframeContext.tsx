"use client"

import React, { createContext, ReactNode, useContext, useState } from "react"
import { DateTime } from "luxon"

// Define the timeframe options
export type TimeframeOption = {
    label: string
    value: DateTime
}

// Default timeframe options
export const defaultTimeframeOptions: TimeframeOption[] = [
    { label: "Last 3 Months", value: DateTime.now().minus({ months: 3 }) },
    { label: "Last Year", value: DateTime.now().minus({ months: 12 }) }
]

// Context type definition
type TimeframeContextType = {
    timeframe: DateTime
    setTimeframe: (timeframe: DateTime) => void
    timeframeOptions: TimeframeOption[]
}

// Create the context with a default value
const TimeframeContext = createContext<TimeframeContextType | undefined>(undefined)

// Provider component
export const TimeframeProvider: React.FC<{
    children: ReactNode
    initialTimeframe?: DateTime
    options?: TimeframeOption[]
}> = ({ 
    children, 
    initialTimeframe = defaultTimeframeOptions[0].value,
    options = defaultTimeframeOptions
}) => {
    const [timeframe, setTimeframe] = useState<DateTime>(initialTimeframe)

    return (
        <TimeframeContext.Provider value={{ timeframe, setTimeframe, timeframeOptions: options }}>
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