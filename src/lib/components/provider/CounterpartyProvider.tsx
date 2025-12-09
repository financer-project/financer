"use client"

import React, { createContext, useContext, useMemo } from "react"
import { useQuery } from "@blitzjs/rpc"
import getCounterparties from "@/src/lib/model/counterparties/queries/getCounterparties"
import { useCurrentHousehold } from "@/src/lib/components/provider/HouseholdProvider"
import { Counterparty } from ".prisma/client"

const CounterpartyContext = createContext<Counterparty[] | undefined>(undefined)

export function CounterpartyProvider({ children }: Readonly<{ children: React.ReactNode }>) {
    const currentHousehold = useCurrentHousehold()
    const [counterpartiesResult] = useQuery(getCounterparties, { householdId: currentHousehold!.id })
    const counterparties = useMemo(() => counterpartiesResult?.counterparties ?? [], [counterpartiesResult])
    
    return (
        <CounterpartyContext.Provider value={counterparties}>
            {children}
        </CounterpartyContext.Provider>
    )
}

export const useCounterparties = (): Counterparty[] => {
    const context = useContext(CounterpartyContext)
    if (context === undefined) {
        throw new Error("useCounterparties must be used within a CounterpartyProvider")
    }
    return context
}