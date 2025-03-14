import { describe, expect, test } from "vitest"
import TestUtilityFactory from "@/test/utility/TestUtilityFactory"
import getCategories from "@/src/lib/model/categories/queries/getCategories"
import createCategory from "@/src/lib/model/categories/mutations/createCategory"
import getCategory from "@/src/lib/model/categories/queries/getCategory"
import updateCategory from "@/src/lib/model/categories/mutations/updateCategory"
import deleteCategory from "@/src/lib/model/categories/mutations/deleteCategory"
import ColorType from "@/src/lib/model/common/ColorType"
import { CategoryType } from "@prisma/client"

describe("Category Mutations & Queries", () => {
    const util = TestUtilityFactory.mock()

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
            expect(category.children).toBeDefined()
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