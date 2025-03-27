import { describe, expect, test } from "vitest"
import Tree, { TreeNode } from "@/src/lib/model/categories/Tree"
import { CategoryType } from "@prisma/client"

interface CategoryLike {
    id: string
    name: string
    type: CategoryType
    parentId: string | null,
    children?: CategoryLike[]
}

describe("Tree", () => {
    // Test Category Tree:
    // - Food (Expense)
    //   - Groceries
    //     - Fruits
    //     - Vegetables
    //   - Restaurant
    // - Income
    //   - Salary
    //   - Investment

    const flatCategories: CategoryLike[] = [
        { id: "food", name: "Food", type: CategoryType.EXPENSE, parentId: null },
        { id: "groceries", name: "Groceries", type: CategoryType.EXPENSE, parentId: "food" },
        { id: "fruits", name: "Fruits", type: CategoryType.EXPENSE, parentId: "groceries" },
        { id: "vegetables", name: "Vegetables", type: CategoryType.EXPENSE, parentId: "groceries" },
        { id: "restaurant", name: "Restaurant", type: CategoryType.EXPENSE, parentId: "food" },
        { id: "income", name: "Income", type: CategoryType.INCOME, parentId: null },
        { id: "salary", name: "Salary", type: CategoryType.INCOME, parentId: "income" },
        { id: "investment", name: "Investment", type: CategoryType.INCOME, parentId: "income" }
    ]

    describe("fromFlatList", () => {
        test("builds a tree from a flat list of categories", () => {
            const tree = Tree.fromFlatList(flatCategories, "id", "parentId", "children")

            // Sollte zwei Root-Knoten haben: "food" und "income"
            expect(tree.getRootNodes()).toHaveLength(2)

            // Überprüfe Food und seine Kinder
            const foodNode = tree.getRootNodes().find(node => node.id === "food")
            expect(foodNode).toBeDefined()
            expect(foodNode?.name).toBe("Food")
            expect(foodNode?.children).toHaveLength(2)

            // Überprüfe Groceries und seine Kinder
            const groceriesNode = foodNode?.children?.find(node => node.id === "groceries")
            expect(groceriesNode).toBeDefined()
            expect(groceriesNode?.children).toHaveLength(2)

            // Überprüfe Income und seine Kinder
            const incomeNode = tree.getRootNodes().find(node => node.id === "income")
            expect(incomeNode).toBeDefined()
            expect(incomeNode?.children).toHaveLength(2)
        })

        test("handles empty list", () => {
            const tree = Tree.fromFlatList([], "id", "parentId", "children")
            expect(tree.getRootNodes()).toHaveLength(0)
        })
    })

    describe("flatten", () => {
        test("flattens a tree back to a list", () => {
            const tree = Tree.fromFlatList(flatCategories, "id", "parentId", "children")
            const flattened = tree.flatten()

            expect(flattened).toHaveLength(flatCategories.length)

            // Stichproben-Validierung
            expect(flattened.some(item => item.id === "food")).toBeTruthy()
            expect(flattened.some(item => item.id === "fruits")).toBeTruthy()
            expect(flattened.some(item => item.id === "salary")).toBeTruthy()

            // Flattened items should not have children property
            const hasChildrenProperty = flattened.some(item => Object.hasOwnProperty.call(item, "children"))
            expect(hasChildrenProperty).toBeFalsy()
        })
    })

    describe("findNode", () => {
        test("finds a node by predicate", () => {
            const tree = Tree.fromFlatList(flatCategories, "id", "parentId", "children")

            // Nach einem Blattknoten suchen
            const fruitsNode = tree.findNode(node => node.id === "fruits")
            expect(fruitsNode).toBeDefined()
            expect(fruitsNode?.name).toBe("Fruits")

            // Nach einem inneren Knoten suchen
            const groceriesNode = tree.findNode(node => node.id === "groceries")
            expect(groceriesNode).toBeDefined()
            expect(groceriesNode?.name).toBe("Groceries")

            // Nach einem Wurzelknoten suchen
            const foodNode = tree.findNode(node => node.id === "food")
            expect(foodNode).toBeDefined()
            expect(foodNode?.name).toBe("Food")
        })

        test("returns undefined for non-existent node", () => {
            const tree = Tree.fromFlatList(flatCategories, "id", "parentId", "children")
            const nonExistentNode = tree.findNode(node => node.id === "does-not-exist")
            expect(nonExistentNode).toBeUndefined()
        })
    })

    describe("fromStructuredTree", () => {
        test("creates a tree from an already structured tree", () => {
            // Manuell einen strukturierten Baum erstellen
            const manualTree: CategoryLike[] = [
                {
                    id: "food",
                    name: "Food",
                    type: CategoryType.EXPENSE,
                    parentId: null,
                    children: [
                        {
                            id: "groceries",
                            name: "Groceries",
                            type: CategoryType.EXPENSE,
                            parentId: "food",
                        }
                    ]
                }
            ]

            const tree = Tree.fromStructuredTree(manualTree as TreeNode<CategoryLike>[], "id", "parentId", "children")

            expect(tree.getRootNodes()).toHaveLength(1)
            expect(tree.getRootNodes()[0].name).toBe("Food")
            expect(tree.getRootNodes()[0].children).toHaveLength(1)
            expect(tree.getRootNodes()[0].children?.[0].name).toBe("Groceries")
        })
    })

    describe("complex operations", () => {
        test("find and manipulate node", () => {
            const tree = Tree.fromFlatList(flatCategories, "id", "parentId", "children")

            // Finde einen Knoten
            const groceriesNode = tree.findNode(node => node.id === "groceries")
            expect(groceriesNode).toBeDefined()

            // Füge einen neuen Knoten als Kind hinzu
            if (groceriesNode) {
                groceriesNode.children?.push({
                    id: "dairy",
                    name: "Dairy Products",
                    type: CategoryType.EXPENSE,
                    parentId: "groceries",
                    children: []
                })
            }

            // Überprüfe, ob der Knoten hinzugefügt wurde
            const dairyNode = tree.findNode(node => node.id === "dairy")
            expect(dairyNode).toBeDefined()
            expect(dairyNode?.name).toBe("Dairy Products")

            // Überprüfe die aktuelle Anzahl der Kinder unter Groceries
            expect(groceriesNode?.children?.length).toBe(3)
        })
    })
})