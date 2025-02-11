"use client"

import React, { createContext, useContext } from "react"
import { useQuery } from "@blitzjs/rpc"
import { useCurrentHousehold } from "@/src/lib/components/provider/HouseholdProvider"
import { Account } from "@prisma/client"
import getAccounts from "@/src/lib/model/account/queries/getAccounts"

const AccountContext = createContext<Account[] | undefined>(undefined)

export function AccountProvider({ children }: Readonly<{ children: React.ReactNode }>) {
    const currentHousehold = useCurrentHousehold()
    const [{ accounts }] = useQuery(getAccounts, { householdId: currentHousehold!.id })

    return (
        <AccountContext.Provider value={accounts}>
            {children}
        </AccountContext.Provider>
    )
}

export const useAccounts = (): Account[] => {
    const context = useContext(AccountContext)
    if (context === null) {
        throw new Error("useCategories must be used within a CategoryContext")
    }
    return context ?? []
}