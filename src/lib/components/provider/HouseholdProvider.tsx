"use client"

import React, { createContext, useContext } from "react"
import { Household } from "@prisma/client"
import { useQuery } from "@blitzjs/rpc"
import getHouseholds from "@/src/lib/model/household/queries/getHouseholds"
import getCurrentHousehold from "@/src/lib/model/household/queries/getCurrentHousehold"

const HouseholdContext = createContext<Household[] | undefined>(undefined)
const CurrentHouseholdContext = createContext<Household | undefined>(undefined)

export function HouseholdProvider({ children }: Readonly<{ children: React.ReactNode }>) {
    const [{ households }] = useQuery(getHouseholds, { orderBy: { name: "asc" } })
    const [currentHousehold] = useQuery(getCurrentHousehold, null)

    return (
        <HouseholdContext.Provider value={households}>
            <CurrentHouseholdContext.Provider value={currentHousehold ?? undefined}>
                {children}
            </CurrentHouseholdContext.Provider>
        </HouseholdContext.Provider>
    )
}

export const useHouseholds = () => {
    const context = useContext(HouseholdContext)
    if (context === null) {
        throw new Error("useHouseholds must be used within a HouseholdProvider")
    }
    return context ?? []
}

export const useCurrentHousehold = (): Household | undefined => {
    const context = useContext(CurrentHouseholdContext)
    if (context === null) {
        throw new Error("useCurrentHouseholds must be used within a HouseholdProvider")
    }
    return context
}