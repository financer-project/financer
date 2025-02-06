"use client"
import { TreeView } from "@/src/lib/components/common/data/TreeView"
import Section from "@/src/lib/components/common/structure/Section"
import { useCategories } from "@/src/lib/components/provider/CategoryProvider"
import { CategoryType } from "@prisma/client"

export const CategoriesList = () => {
    return (
        <div>
            <Section title={"Income"}>
                <TreeView
                    tree={useCategories().filter(node => node.type === CategoryType.INCOME)}
                    renderNode={node => node.name} />
            </Section>
            <Section title={"Expenses"}>
                <TreeView
                    tree={useCategories().filter(node => node.type === CategoryType.EXPENSE)}
                    renderNode={node => node.name} />
            </Section>
        </div>
    )
}
