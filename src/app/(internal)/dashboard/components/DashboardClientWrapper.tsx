"use client"

import React from "react"
import { TimeframeProvider, useTimeframe } from "../context/TimeframeContext"
import { SelectField } from "@/src/lib/components/common/form/elements/SelectField"
import { DateTime } from "luxon"

// Component for the timeframe selector in the header
export const TimeframeSelector: React.FC = () => {
    const { timeframe, setTimeframe, timeframeOptions } = useTimeframe()

    return (
        <SelectField<DateTime>
            className={"min-w-48"}
            placeholder="Timeframe"
            value={timeframe}
            onChange={value => value && setTimeframe(value)}
            options={timeframeOptions} />
    )
}

// Client wrapper for the dashboard content
const DashboardClientWrapper: React.FC<{
    children?: React.ReactNode
}> = ({ children }) => {
    return (
        <TimeframeProvider>
            {children}
        </TimeframeProvider>
    )
}

export default DashboardClientWrapper