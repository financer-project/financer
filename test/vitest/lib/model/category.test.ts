import { describe, expect, test } from "vitest"
import TestUtilityMock from "@/test/utility/TestUtilityMock"
import getCategories from "@/src/lib/model/categories/queries/getCategories"
import createCategory from "@/src/lib/model/categories/mutations/createCategory"
import getCategory from "@/src/lib/model/categories/queries/getCategory"
import updateCategory from "@/src/lib/model/categories/mutations/updateCategory"
import deleteCategory from "@/src/lib/model/categories/mutations/deleteCategory"
import ColorType from "@/src/lib/model/common/ColorType"
import { CategoryType } from "@prisma/client"

describe("Category Mutations & Queries", () => {
    const util = TestUtilityMock.getInstance()

    beforeEach(async () => {
        await util.seedDatabase()
    })

    describe("get", () => {
        test("get all categories for a household", async () => {
            const categories = await getCategories({ householdId: util.getTestData().households.standard.id }, util.getMockContext())
            expect(categories).toHaveLength(2)
        })

        test("get specific category by ID", async () => {
            const category = await getCategory({ id: util.getTestData().categories.standard.income.id }, util.getMockContext())
            expect(category.id).toBe(util.getTestData().categories.standard.income.id)
        })
    })

    describe("create", () => {
        test("creates a new category successfully", async () => {
            const result = await createCategory({
                name: "Test Category",
                householdId: util.getTestData().households.standard.id,
                type: CategoryType.EXPENSE,
                color: ColorType.INDIGO,
                parentId: null
            }, util.getMockContext())

            expect(result.id).not.toBeUndefined()
            expect(result.name).toBe("Test Category")
            expect(result.type).toBe(CategoryType.EXPENSE)
        })

        test("creates a new child category successfully", async () => {
            const parentCategory = await createCategory({
                name: "Parent Category",
                parentId: null,
                householdId: util.getTestData().households.standard.id,
                type: CategoryType.EXPENSE,
                color: null
            }, util.getMockContext())

            const childCategory = await createCategory({
                name: "Child Category",
                householdId: util.getTestData().households.standard.id,
                type: CategoryType.EXPENSE,
                parentId: parentCategory.id,
                color: null
            }, util.getMockContext())

            expect(childCategory.parentId).toBe(parentCategory.id)
        })

        test("fails when creating child with different type than parent", async () => {
            const parentCategory = await createCategory({
                name: "Parent Category",
                householdId: util.getTestData().households.standard.id,
                type: CategoryType.EXPENSE,
                color: null,
                parentId: null
            }, util.getMockContext())

            await expect(async () => createCategory({
                name: "Child Category",
                householdId: util.getTestData().households.standard.id,
                type: CategoryType.INCOME,
                parentId: parentCategory.id,
                color: null
            }, util.getMockContext())).rejects.toThrowError("Type must be the same as parent")
        })

        test("creates a new category with invalid data", async () => {
            await expect(async () => createCategory({
                name: "",
                householdId: util.getTestData().households.standard.id,
                type: CategoryType.EXPENSE,
                parentId: null,
                color: null
            }, util.getMockContext())).rejects.toThrowError()
        })
    })

    describe("update", () => {
        test("updates a category successfully", async () => {
            const result = await updateCategory({
                id: util.getTestData().categories.standard.income.id,
                householdId: util.getTestData().households.standard.id,
                name: "Updated Category Name",
                type: CategoryType.INCOME,
                color: ColorType.GREEN,
                parentId: null
            }, util.getMockContext())

            expect(result.name).toBe("Updated Category Name")
            expect(result.color).toBe("green")
        })

        test("fails to update non-existing category", async () => {
            await expect(async () => updateCategory({

                id: "non-existent-id",
                householdId: util.getTestData().households.standard.id,
                name: "Invalid Update",
                type: CategoryType.INCOME,
                parentId: null,
                color: null

            }, util.getMockContext())).rejects.toThrowError()
        })

        test("updates parent category color and propagates to direct children", async () => {
            // Create parent category
            const parentCategory = await createCategory({
                name: "Parent Category",
                householdId: util.getTestData().households.standard.id,
                type: CategoryType.EXPENSE,
                color: ColorType.BLUE,
                parentId: null
            }, util.getMockContext())

            // Create child category
            const childCategory = await createCategory({
                name: "Child Category",
                householdId: util.getTestData().households.standard.id,
                type: CategoryType.EXPENSE,
                color: ColorType.RED,
                parentId: parentCategory.id
            }, util.getMockContext())

            // Update parent color
            await updateCategory({
                id: parentCategory.id,
                householdId: util.getTestData().households.standard.id,
                name: parentCategory.name,
                type: parentCategory.type,
                color: ColorType.GREEN,
                parentId: null
            }, util.getMockContext())

            // Verify child color was updated
            const updatedChild = await getCategory({ id: childCategory.id }, util.getMockContext())
            expect(updatedChild.color).toBe("green")
        })

        test("updates parent category color and propagates to nested children recursively", async () => {
            // Create parent category
            const parentCategory = await createCategory({
                name: "Parent Category",
                householdId: util.getTestData().households.standard.id,
                type: CategoryType.EXPENSE,
                color: ColorType.BLUE,
                parentId: null
            }, util.getMockContext())

            // Create first level child
            const childCategory = await createCategory({
                name: "Child Category",
                householdId: util.getTestData().households.standard.id,
                type: CategoryType.EXPENSE,
                color: ColorType.RED,
                parentId: parentCategory.id
            }, util.getMockContext())

            // Create second level child (grandchild)
            const grandchildCategory = await createCategory({
                name: "Grandchild Category",
                householdId: util.getTestData().households.standard.id,
                type: CategoryType.EXPENSE,
                color: ColorType.YELLOW,
                parentId: childCategory.id
            }, util.getMockContext())

            // Update parent color
            await updateCategory({
                id: parentCategory.id,
                householdId: util.getTestData().households.standard.id,
                name: parentCategory.name,
                type: parentCategory.type,
                color: ColorType.PURPLE,
                parentId: null
            }, util.getMockContext())

            // Verify both child and grandchild colors were updated
            const updatedChild = await getCategory({ id: childCategory.id }, util.getMockContext())
            const updatedGrandchild = await getCategory({ id: grandchildCategory.id }, util.getMockContext())
            
            expect(updatedChild.color).toBe("purple")
            expect(updatedGrandchild.color).toBe("purple")
        })

        test("updates parent category color to null and propagates to children", async () => {
            // Create parent category
            const parentCategory = await createCategory({
                name: "Parent Category",
                householdId: util.getTestData().households.standard.id,
                type: CategoryType.EXPENSE,
                color: ColorType.BLUE,
                parentId: null
            }, util.getMockContext())

            // Create child category
            const childCategory = await createCategory({
                name: "Child Category",
                householdId: util.getTestData().households.standard.id,
                type: CategoryType.EXPENSE,
                color: ColorType.RED,
                parentId: parentCategory.id
            }, util.getMockContext())

            // Update parent color to null
            await updateCategory({
                id: parentCategory.id,
                householdId: util.getTestData().households.standard.id,
                name: parentCategory.name,
                type: parentCategory.type,
                color: null,
                parentId: null
            }, util.getMockContext())

            // Verify child color was updated to null
            const updatedChild = await getCategory({ id: childCategory.id }, util.getMockContext())
            expect(updatedChild.color).toBeNull()
        })

        test("updating category without color change does not affect children", async () => {
            // Create parent category
            const parentCategory = await createCategory({
                name: "Parent Category",
                householdId: util.getTestData().households.standard.id,
                type: CategoryType.EXPENSE,
                color: ColorType.BLUE,
                parentId: null
            }, util.getMockContext())

            // Create child category
            const childCategory = await createCategory({
                name: "Child Category",
                householdId: util.getTestData().households.standard.id,
                type: CategoryType.EXPENSE,
                color: ColorType.RED,
                parentId: parentCategory.id
            }, util.getMockContext())

            // Update parent name only (no color change)
            await updateCategory({
                id: parentCategory.id,
                householdId: util.getTestData().households.standard.id,
                name: "Updated Parent Name",
                type: parentCategory.type,
                color: parentCategory.color as ColorType | null,
                parentId: null
            }, util.getMockContext())

            // Verify child color was not changed
            const updatedChild = await getCategory({ id: childCategory.id }, util.getMockContext())
            expect(updatedChild.color).toBe("red")
        })

        test("batch update optimization works with deep category hierarchy", async () => {
            // Create a deep hierarchy: Parent -> Child1 -> Child2 -> Child3 -> Child4
            const parentCategory = await createCategory({
                name: "Root Category",
                householdId: util.getTestData().households.standard.id,
                type: CategoryType.EXPENSE,
                color: ColorType.BLUE,
                parentId: null
            }, util.getMockContext())

            const child1 = await createCategory({
                name: "Child Level 1",
                householdId: util.getTestData().households.standard.id,
                type: CategoryType.EXPENSE,
                color: ColorType.RED,
                parentId: parentCategory.id
            }, util.getMockContext())

            const child2 = await createCategory({
                name: "Child Level 2",
                householdId: util.getTestData().households.standard.id,
                type: CategoryType.EXPENSE,
                color: ColorType.YELLOW,
                parentId: child1.id
            }, util.getMockContext())

            const child3 = await createCategory({
                name: "Child Level 3",
                householdId: util.getTestData().households.standard.id,
                type: CategoryType.EXPENSE,
                color: ColorType.GREEN,
                parentId: child2.id
            }, util.getMockContext())

            const child4 = await createCategory({
                name: "Child Level 4",
                householdId: util.getTestData().households.standard.id,
                type: CategoryType.EXPENSE,
                color: ColorType.PINK,
                parentId: child3.id
            }, util.getMockContext())

            // Create multiple children at level 1 to test batch update with multiple branches
            const child1_2 = await createCategory({
                name: "Child Level 1 Branch 2",
                householdId: util.getTestData().households.standard.id,
                type: CategoryType.EXPENSE,
                color: ColorType.ORANGE,
                parentId: parentCategory.id
            }, util.getMockContext())

            const child1_3 = await createCategory({
                name: "Child Level 1 Branch 3",
                householdId: util.getTestData().households.standard.id,
                type: CategoryType.EXPENSE,
                color: ColorType.CYAN,
                parentId: parentCategory.id
            }, util.getMockContext())

            // Update root category color - should propagate to all 6 descendants
            await updateCategory({
                id: parentCategory.id,
                householdId: util.getTestData().households.standard.id,
                name: parentCategory.name,
                type: parentCategory.type,
                color: ColorType.PURPLE,
                parentId: null
            }, util.getMockContext())

            // Verify all descendants have the new color
            const updatedChild1 = await getCategory({ id: child1.id }, util.getMockContext())
            const updatedChild2 = await getCategory({ id: child2.id }, util.getMockContext())
            const updatedChild3 = await getCategory({ id: child3.id }, util.getMockContext())
            const updatedChild4 = await getCategory({ id: child4.id }, util.getMockContext())
            const updatedChild1_2 = await getCategory({ id: child1_2.id }, util.getMockContext())
            const updatedChild1_3 = await getCategory({ id: child1_3.id }, util.getMockContext())
            
            expect(updatedChild1.color).toBe("purple")
            expect(updatedChild2.color).toBe("purple")
            expect(updatedChild3.color).toBe("purple")
            expect(updatedChild4.color).toBe("purple")
            expect(updatedChild1_2.color).toBe("purple")
            expect(updatedChild1_3.color).toBe("purple")
        })
    })

    describe("delete", () => {
        test("deletes a category successfully", async () => {
            await deleteCategory({ id: util.getTestData().categories.standard.income.id }, util.getMockContext())
            await expect(async () => getCategory({ id: util.getTestData().categories.standard.income.id }, util.getMockContext()))
                .rejects.toThrowError()
        })

        test("fails to delete non-existing category", async () => {
            await expect(async () => deleteCategory({ id: "non-existent-id" }, util.getMockContext()))
                .rejects.toThrowError()
        })
    })
})
