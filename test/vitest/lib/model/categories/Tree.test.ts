import { describe, expect, test } from "vitest"
import { Tree, TreeNode } from "@/src/lib/model/categories/Tree"
import { CategoryType } from "@prisma/client"

interface CategoryLike {
    id: string
    name: string
    type: CategoryType
    parentId: string | null,
    children?: CategoryLike[]
}

// Helper function to find a node in a tree by ID
function findNodeById<T>(tree: Tree<T>, id: string): TreeNode<T> | null {
    for (const child of tree.getChildren()) {
        if (child.id === id) {
            return child;
        }
        const found = child.findNode(node => node.id === id);
        if (found) {
            return found;
        }
    }
    return null;
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
            const rootNodes = Tree.fromFlatList(flatCategories, "id", "parentId")

            // Should have two root nodes: "food" and "income"
            expect(rootNodes.getChildren()).toHaveLength(2)

            // Check Food and its children
            const foodNode = findNodeById(rootNodes, "food")
            expect(foodNode).not.toBeNull()
            expect(foodNode?.data.name).toBe("Food")
            expect(foodNode?.getChildren()).toHaveLength(2)

            // Check Groceries and its children
            const groceriesNode = foodNode?.getChildren().find(node => node.id === "groceries")
            expect(groceriesNode).toBeDefined()
            expect(groceriesNode?.getChildren()).toHaveLength(2)

            // Check Income and its children
            const incomeNode = findNodeById(rootNodes, "income")
            expect(incomeNode).not.toBeNull()
            expect(incomeNode?.getChildren()).toHaveLength(2)
        })

        test("handles empty list", () => {
            const rootNodes = Tree.fromFlatList([], "id", "parentId")
            expect(rootNodes.getChildren()).toHaveLength(0)
        })
    })

    describe("flatten", () => {
        test("flattens a tree back to a list", () => {
            const rootNodes = Tree.fromFlatList(flatCategories, "id", "parentId")
            const flattened = rootNodes.flatten()

            expect(flattened).toHaveLength(flatCategories.length)

            // Sample validation
            expect(flattened.some(item => item.id === "food")).toBeTruthy()
            expect(flattened.some(item => item.id === "fruits")).toBeTruthy()
            expect(flattened.some(item => item.id === "salary")).toBeTruthy()
        })
    })

    describe("findNode", () => {
        test("finds a node by predicate", () => {
            const rootNodes = Tree.fromFlatList(flatCategories, "id", "parentId")

            // Search for a leaf node
            const fruitsNode = findNodeById(rootNodes, "fruits")
            expect(fruitsNode).not.toBeNull()
            expect(fruitsNode?.data.name).toBe("Fruits")

            // Search for an inner node
            const groceriesNode = findNodeById(rootNodes, "groceries")
            expect(groceriesNode).not.toBeNull()
            expect(groceriesNode?.data.name).toBe("Groceries")

            // Search for a root node
            const foodNode = findNodeById(rootNodes, "food")
            expect(foodNode).not.toBeNull()
            expect(foodNode?.data.name).toBe("Food")
        })

        test("returns null for non-existent node", () => {
            const rootNodes = Tree.fromFlatList(flatCategories, "id", "parentId")
            const nonExistentNode = findNodeById(rootNodes, "does-not-exist")
            expect(nonExistentNode).toBeNull()
        })
    })

    describe("filter", () => {
        test("filters nodes based on a predicate", () => {
            const rootNodes = Tree.fromFlatList(flatCategories, "id", "parentId")

            // Filter to only include expense categories
            const filteredTree = rootNodes.filter(node => node.data.type === CategoryType.EXPENSE)

            expect(filteredTree).not.toBeNull()
            expect(filteredTree?.getChildren()).toHaveLength(1) // Only the "food" tree should remain
            expect(filteredTree?.getChildren()[0].data.name).toBe("Food")
        })
    })

    describe("traverseNodes", () => {
        test("traverses all nodes in the tree", () => {
            const rootNodes = Tree.fromFlatList(flatCategories, "id", "parentId")
            const traversedNodes: string[] = []

            // Only traverse the children, not the root node itself
            rootNodes.getChildren().forEach(child => {
                child.traverseNodes(node => {
                    traversedNodes.push(node.id as string)
                })
            })

            // Should have traversed all nodes
            expect(traversedNodes.length).toBeGreaterThan(0)

            // Check that all nodes were traversed
            for (const category of flatCategories) {
                expect(traversedNodes).toContain(category.id)
            }
        })
    })

    describe("creating trees from structured data", () => {
        test("creates a tree from a flat list with parent-child relationships", () => {
            // Create a subset of the flat categories for this test
            const subsetCategories: CategoryLike[] = [
                { id: "food", name: "Food", type: CategoryType.EXPENSE, parentId: null },
                { id: "groceries", name: "Groceries", type: CategoryType.EXPENSE, parentId: "food" },
                { id: "fruits", name: "Fruits", type: CategoryType.EXPENSE, parentId: "groceries" },
                { id: "vegetables", name: "Vegetables", type: CategoryType.EXPENSE, parentId: "groceries" }
            ]

            const rootNodes = Tree.fromFlatList(subsetCategories, "id", "parentId")

            // Should have one root node: "food"
            expect(rootNodes.getChildren()).toHaveLength(1)

            // Get the food node
            const foodNode = findNodeById(rootNodes, "food")
            expect(foodNode).not.toBeNull()
            expect(foodNode?.data.name).toBe("Food")
            expect(foodNode?.getChildren()).toHaveLength(1)

            // Get the groceries node
            const groceriesNode = findNodeById(rootNodes, "groceries")
            expect(groceriesNode).not.toBeNull()
            expect(groceriesNode?.data.name).toBe("Groceries")
            expect(groceriesNode?.getChildren()).toHaveLength(2)

            // Get the fruits node
            const fruitsNode = findNodeById(rootNodes, "fruits")
            expect(fruitsNode).not.toBeNull()
            expect(fruitsNode?.data.name).toBe("Fruits")
            expect(fruitsNode?.getChildren()).toHaveLength(0)

            // Get the vegetables node
            const vegetablesNode = findNodeById(rootNodes, "vegetables")
            expect(vegetablesNode).not.toBeNull()
            expect(vegetablesNode?.data.name).toBe("Vegetables")
            expect(vegetablesNode?.getChildren()).toHaveLength(0)
        })
    })
})
