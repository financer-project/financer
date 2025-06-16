"use client"

import React, { createContext, useContext } from "react"
import { useQuery } from "@blitzjs/rpc"
import getTags from "@/src/lib/model/tags/queries/getTags"
import { useCurrentHousehold } from "@/src/lib/components/provider/HouseholdProvider"
import { Tag } from ".prisma/client"

const TagContext = createContext<Tag[] | undefined>(undefined)

export function TagProvider({ children }: Readonly<{ children: React.ReactNode }>) {
    const currentHousehold = useCurrentHousehold()
    const [tagsResult] = useQuery(getTags, { householdId: currentHousehold!.id })
    
    return (
        <TagContext.Provider value={tagsResult?.tags ?? []}>
            {children}
        </TagContext.Provider>
    )
}

export const useTags = (): Tag[] => {
    const context = useContext(TagContext)
    if (context === undefined) {
        throw new Error("useTags must be used within a TagProvider")
    }
    return context
}