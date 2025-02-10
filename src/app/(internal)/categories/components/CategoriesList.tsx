"use client"
import { TreeView } from "@/src/lib/components/common/data/TreeView"
import Section from "@/src/lib/components/common/structure/Section"
import { useCategories } from "@/src/lib/components/provider/CategoryProvider"
import { CategoryType } from "@prisma/client"
import { useState } from "react"
import { Button } from "@/src/lib/components/ui/button"
import { ChevronsDownUp, ChevronsUpDown } from "lucide-react"
import Link from "next/link"

export const CategoriesList = () => {
    const [expandAllIncome, setExpandAllIncome] = useState<boolean>(true)
    const [expandAllExpense, setExpandAllExpense] = useState<boolean>(true)

    const renderActions = (setter: (value: boolean) => void, type: CategoryType) => (
        <div className={"flex flex-row gap-2"}>
            <Button variant={"ghost"}
                    size={"icon"}
                    onClick={() => setter(true)}>
                <ChevronsUpDown />
            </Button>
            <Button variant={"ghost"}
                    size={"icon"}
                    onClick={() => setter(false)}>
                <ChevronsDownUp />
            </Button>
            <Button variant={"outline"} asChild>
                <Link href={{ pathname: "/categories/new", query: { type: type } }}>
                    New
                </Link>
            </Button>
        </div>
    )

    return (
        <div>
            <Section title={"Income"}
                     subtitle={"All categories that are marked as income."}
                     actions={renderActions(setExpandAllIncome, CategoryType.INCOME)}>
                <TreeView
                    tree={useCategories().filter(node => node.type === CategoryType.INCOME)}
                    renderNode={node => node.name}
                    expandedAll={expandAllIncome} />
            </Section>
            <Section title={"Expenses"}
                     subtitle={"All categories that are marked as expense."}
                     actions={renderActions(setExpandAllExpense, CategoryType.EXPENSE)}>
                <TreeView
                    tree={useCategories().filter(node => node.type === CategoryType.EXPENSE)}
                    renderNode={node => node.name}
                    expandedAll={expandAllExpense} />
            </Section>
        </div>
    )
}
