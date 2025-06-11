"use client"

import React, { createContext, useContext } from "react"
import { useQuery } from "@blitzjs/rpc"
import getCategories from "@/src/lib/model/categories/queries/getCategories"
import { Tree } from "@/src/lib/model/categories/Tree"
import { useCurrentHousehold } from "@/src/lib/components/provider/HouseholdProvider"
import { Category } from ".prisma/client"

const CategoryContext = createContext<Tree<Category> | undefined>(undefined)

export function CategoryProvider({ children }: Readonly<{ children: React.ReactNode }>) {
    const currentHousehold = useCurrentHousehold()
    const [categories] = useQuery(getCategories, { householdId: currentHousehold!.id })
    const categoryTrees = () =>
        Tree.fromFlatList<Category>(
            categories ?? [],
            "id",
            "parentId"
        )

    return (
        <CategoryContext.Provider value={categoryTrees()}>
            {children}
        </CategoryContext.Provider>
    )
}

export const useCategories = (): Tree<Category> => {
    const context = useContext(CategoryContext)
    if (context === null) {
        throw new Error("useCategories must be used within a CategoryContext")
    }
    return context!
}
