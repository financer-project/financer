"use client"

import React, { createContext, useContext } from "react"
import getHouseholds from "@/src/lib/model/household/queries/getHouseholds"
import { useQuery } from "@blitzjs/rpc"
import { Household } from "@prisma/client"

const HouseholdContext = createContext<Household[] | null>(null)

export function HouseholdProvider({ children }: Readonly<{ children: React.ReactNode }>) {
    const [{ households }] = useQuery(getHouseholds, { orderBy: { name: "asc" } })

    return (
        <HouseholdContext.Provider value={households}>
            {children}
        </HouseholdContext.Provider>
    )
}

export const useHouseholds = () => {
    const context = useContext(HouseholdContext)
    if (context === null) {
        throw new Error("useHouseholds must be used within a HouseholdProvider")
    }
    return context
}