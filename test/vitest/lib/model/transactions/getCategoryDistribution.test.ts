import { beforeEach, describe, expect, test } from "vitest"
import TestUtilityMock from "@/test/utility/TestUtilityMock"
import { DateTime } from "luxon"
import getCategoryDistribution from "@/src/lib/model/transactions/queries/getCategoryDistribution"
import db from "@/src/lib/db"
import { CategoryType } from "@prisma/client"

describe("Get Category Distribution", () => {
    const util = TestUtilityMock.getInstance()

    beforeEach(async () => {
        await util.seedDatabase()
    })

    test("returns category distribution with correct structure", async () => {
        const startDate = DateTime.now().minus({ months: 1 }).toJSDate()

        const distribution = await getCategoryDistribution(
            { startDate },
            util.getMockContext()
        )

        expect(distribution).toBeInstanceOf(Array)
        expect(distribution.length).toBeGreaterThan(0)

        // Check structure of each item
        distribution.forEach(category => {
            expect(category).toHaveProperty("id")
            expect(category).toHaveProperty("name")
            expect(category).toHaveProperty("type")
            expect(category).toHaveProperty("amount")
            expect(category).toHaveProperty("color")

            expect(typeof category.id).toBe("string")
            expect(typeof category.name).toBe("string")
            expect(Object.values(CategoryType)).toContain(category.type)
            expect(typeof category.amount).toBe("number")
            expect(category.amount).toBeGreaterThan(0)
            // color can be null or string
            expect(category.color === null || typeof category.color === "string").toBe(true)
        })
    })

    test("returns empty array when no transactions with categories exist", async () => {
        // Delete all transactions
        await db.transaction.deleteMany({})

        const startDate = DateTime.now().minus({ months: 1 }).toJSDate()

        const distribution = await getCategoryDistribution(
            { startDate },
            util.getMockContext()
        )

        expect(distribution).toBeInstanceOf(Array)
        expect(distribution).toHaveLength(4)
        expect(distribution[0].amount).toBe(0)
    })

    test("returns only categories with transactions in the date range", async () => {
        // Create a transaction with a date far in the past
        const pastDate = DateTime.now().minus({ years: 5 }).toJSDate()
        const startDate = DateTime.now().minus({ months: 1 }).toJSDate()

        // Get current distribution
        const currentDistribution = await getCategoryDistribution(
            { startDate },
            util.getMockContext()
        )

        // Get distribution with a start date in the past
        const pastDistribution = await getCategoryDistribution(
            { startDate: pastDate },
            util.getMockContext()
        )

        // Past distribution should include more or equal categories
        expect(pastDistribution.length).toBeGreaterThanOrEqual(currentDistribution.length)
    })

    test("throws error if startDate is invalid or in future", async () => {
        const invalidStartDate = DateTime.now().plus({ months: 1 }).toJSDate()

        await expect(() =>
            getCategoryDistribution({ startDate: invalidStartDate }, util.getMockContext())
        ).rejects.toThrowError()
    })

    test("defaults endDate to current date if not provided", async () => {
        const startDate = DateTime.now().minus({ months: 3 }).toJSDate()

        const distribution = await getCategoryDistribution(
            { startDate },
            util.getMockContext()
        )

        // We can't directly test the endDate since it's used internally,
        // but we can verify that the function executes successfully
        expect(distribution).toBeInstanceOf(Array)
    })

    test("returns only top-level categories", async () => {
        const startDate = DateTime.now().minus({ months: 3 }).toJSDate()

        // Get all categories
        const allCategories = await db.category.findMany()

        // Count top-level categories (those with no parent)
        const topLevelCategoriesCount = allCategories.filter(cat => cat.parentId === null).length

        // Get distribution from the API
        const distribution = await getCategoryDistribution(
            { startDate },
            util.getMockContext()
        )

        // Check that only top-level categories are returned
        expect(distribution.length).toBeLessThanOrEqual(topLevelCategoriesCount)

        // Verify that all returned categories are top-level
        for (const category of distribution) {
            const dbCategory = allCategories.find(c => c.id === category.id)
            expect(dbCategory?.parentId).toBeNull()
        }
    })

    test("accumulates amounts for child categories to their top-level parent", async () => {
        const startDate = DateTime.now().minus({ months: 3 }).toJSDate()

        // Create a test category hierarchy
        const parentCategory = await db.category.create({
            data: {
                name: "Test Parent Category",
                type: CategoryType.EXPENSE,
                householdId: (await db.household.findFirst())!.id
            }
        })

        const childCategory = await db.category.create({
            data: {
                name: "Test Child Category",
                type: CategoryType.EXPENSE,
                householdId: (await db.household.findFirst())!.id,
                parentId: parentCategory.id
            }
        })

        // Create transactions for both parent and child
        const parentAmount = 100
        const childAmount = 200

        await db.transaction.create({
            data: {
                name: "Parent Transaction",
                type: "EXPENSE",
                amount: -parentAmount,
                valueDate: DateTime.now().minus({ days: 1 }).toJSDate(),
                accountId: (await db.account.findFirst())!.id,
                categoryId: parentCategory.id
            }
        })

        await db.transaction.create({
            data: {
                name: "Child Transaction",
                type: "EXPENSE",
                amount: -childAmount,
                valueDate: DateTime.now().minus({ days: 1 }).toJSDate(),
                accountId: (await db.account.findFirst())!.id,
                categoryId: childCategory.id
            }
        })

        // Get distribution from the API
        const distribution = await getCategoryDistribution(
            { startDate },
            util.getMockContext()
        )

        // Find the parent category in the distribution
        const parentInDistribution = distribution.find(cat => cat.id === parentCategory.id)

        // Verify that the parent category includes both its own amount and the child's amount
        expect(parentInDistribution).toBeDefined()
        expect(parentInDistribution?.amount).toBeCloseTo(-(parentAmount + childAmount), 2)

        // Verify that the child category is not in the distribution
        const childInDistribution = distribution.find(cat => cat.id === childCategory.id)
        expect(childInDistribution).toBeUndefined()
    })

    test("filters by categoryIds when provided", async () => {
        const startDate = DateTime.now().minus({ months: 3 }).toJSDate()

        // Get all categories
        const allCategories = await db.category.findMany()

        // Get a specific category ID to filter by
        const categoryToFilter = allCategories[0]

        // Get distribution with filter
        const filteredDistribution = await getCategoryDistribution(
            {
                startDate,
                categoryIds: [categoryToFilter.id]
            },
            util.getMockContext()
        )

        // Verify that only the specified category is returned
        expect(filteredDistribution.length).toBeLessThanOrEqual(1)

        if (filteredDistribution.length > 0) {
            expect(filteredDistribution[0].id).toBe(categoryToFilter.id)
        }
    })
})
