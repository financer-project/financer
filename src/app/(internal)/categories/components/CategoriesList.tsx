"use client"
import { TreeView } from "@/src/lib/components/common/data/TreeView"
import { useCategories } from "@/src/lib/components/provider/CategoryProvider"

export const CategoriesList = () => {
    return (
        <div>
            <TreeView
                tree={useCategories()}
                renderNode={node => node.name} />
        </div>
    )
}
