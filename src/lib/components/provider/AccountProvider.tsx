"use client"

import React, { createContext, useContext } from "react"
import { useQuery } from "@blitzjs/rpc"
import { useCurrentHousehold } from "@/src/lib/components/provider/HouseholdProvider"
import { Account } from "@prisma/client"
import getAccounts from "@/src/lib/model/account/queries/getAccounts"
import getCurrentMembership from "@/src/lib/model/household/queries/getCurrentMembership"

interface AccountContextValue {
    accounts: Account[]
    defaultAccountId: string | null
}

const AccountContext = createContext<AccountContextValue>({ accounts: [], defaultAccountId: null })

export function AccountProvider({ children }: Readonly<{ children: React.ReactNode }>) {
    const currentHousehold = useCurrentHousehold()
    const [{ accounts }] = useQuery(getAccounts, { householdId: currentHousehold!.id })
    const [membership] = useQuery(getCurrentMembership, { householdId: currentHousehold!.id })

    return (
        <AccountContext.Provider value={{ accounts, defaultAccountId: membership?.defaultAccountId ?? null }}>
            {children}
        </AccountContext.Provider>
    )
}

export const useAccounts = (): Account[] => {
    const context = useContext(AccountContext)
    if (context === null) {
        throw new Error("useAccounts must be used within an AccountProvider")
    }
    return context.accounts
}

export const useDefaultAccountId = (): string | null => {
    const context = useContext(AccountContext)
    if (context === null) {
        throw new Error("useDefaultAccountId must be used within an AccountProvider")
    }
    return context.defaultAccountId
}