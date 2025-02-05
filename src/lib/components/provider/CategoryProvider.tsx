"use client"

import React, { createContext, useContext } from "react"
import { useQuery } from "@blitzjs/rpc"
import { CategoryModel } from "@/src/lib/model/categories/queries/getCategory"
import getCategories from "@/src/lib/model/categories/queries/getCategories"
import Tree from "@/src/lib/model/categories/Tree"
import { useCurrentHousehold } from "@/src/lib/components/provider/HouseholdProvider"

const CategoryContext = createContext<Tree<CategoryModel> | undefined>(undefined)

export function CategoryProvider({ children }: Readonly<{ children: React.ReactNode }>) {
    const currentHousehold = useCurrentHousehold()
    const [categories] = useQuery(getCategories, { householdId: currentHousehold!.id })
    const categoryTree = () =>
        new Tree<CategoryModel>(categories ?? [], "id", "parentId", "children")

    return (
        <CategoryContext.Provider value={categoryTree()}>
            {children}
        </CategoryContext.Provider>
    )
}

export const useCategories = (): Tree<CategoryModel> => {
    const context = useContext(CategoryContext)
    if (context === null) {
        throw new Error("useCategories must be used within a CategoryContext")
    }
    return context!
}