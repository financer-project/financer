import { beforeEach, describe, expect, test } from "vitest"
import TestUtilityMock from "@/test/utility/TestUtilityMock"
import { DateTime } from "luxon"
import getDashboardKPIs from "@/src/lib/model/dashboard/queries/getDashboardKPIs"
import db from "@/src/lib/db"

describe("Get Dashboard KPIs", () => {
    const util = TestUtilityMock.getInstance()

    beforeEach(async () => {
        await util.seedDatabase()
    })

    test("returns all KPIs with previous period data", async () => {
        const startDate = DateTime.now().minus({ months: 1 }).toJSDate()
        
        const kpis = await getDashboardKPIs(
            { startDate, previousPeriod: true },
            util.getMockContext()
        )

        // Check that all expected properties are present
        expect(kpis).toHaveProperty("currentBalance")
        expect(kpis).toHaveProperty("previousBalance")
        expect(kpis).toHaveProperty("transactionCount")
        expect(kpis).toHaveProperty("previousTransactionCount")
        expect(kpis).toHaveProperty("totalIncome")
        expect(kpis).toHaveProperty("previousIncome")
        expect(kpis).toHaveProperty("totalExpenses")
        expect(kpis).toHaveProperty("previousExpenses")

        // Check types
        expect(typeof kpis.currentBalance).toBe("number")
        expect(typeof kpis.previousBalance).toBe("number")
        expect(typeof kpis.transactionCount).toBe("number")
        expect(typeof kpis.previousTransactionCount).toBe("number")
        expect(typeof kpis.totalIncome).toBe("number")
        expect(typeof kpis.previousIncome).toBe("number")
        expect(typeof kpis.totalExpenses).toBe("number")
        expect(typeof kpis.previousExpenses).toBe("number")

        // Check that income is positive and expenses are negative
        expect(kpis.totalIncome).toBeGreaterThanOrEqual(0)
        expect(kpis.totalExpenses).toBeLessThanOrEqual(0)
    })

    test("returns KPIs without previous period data", async () => {
        const startDate = DateTime.now().minus({ months: 1 }).toJSDate()
        
        const kpis = await getDashboardKPIs(
            { startDate, previousPeriod: false },
            util.getMockContext()
        )

        // Check that current period properties are present
        expect(kpis).toHaveProperty("currentBalance")
        expect(kpis).toHaveProperty("transactionCount")
        expect(kpis).toHaveProperty("totalIncome")
        expect(kpis).toHaveProperty("totalExpenses")

        // Check that previous period properties are not present
        expect(kpis).not.toHaveProperty("previousBalance")
        expect(kpis).not.toHaveProperty("previousTransactionCount")
        expect(kpis).not.toHaveProperty("previousIncome")
        expect(kpis).not.toHaveProperty("previousExpenses")
    })

    test("returns zero values when no transactions exist", async () => {
        // Delete all transactions
        await db.transaction.deleteMany({})

        const startDate = DateTime.now().minus({ months: 1 }).toJSDate()
        
        const kpis = await getDashboardKPIs(
            { startDate, previousPeriod: true },
            util.getMockContext()
        )

        // Check that all values are zero
        expect(kpis.currentBalance).toBe(0)
        expect(kpis.previousBalance).toBe(0)
        expect(kpis.transactionCount).toBe(0)
        expect(kpis.previousTransactionCount).toBe(0)
        expect(kpis.totalIncome).toBe(0)
        expect(kpis.previousIncome).toBe(0)
        expect(kpis.totalExpenses).toBe(0)
        expect(kpis.previousExpenses).toBe(0)
    })

    test("throws error if startDate is invalid or in future", async () => {
        const invalidStartDate = DateTime.now().plus({ months: 1 }).toJSDate()

        await expect(() =>
            getDashboardKPIs({ startDate: invalidStartDate }, util.getMockContext())
        ).rejects.toThrowError()
    })

    test("defaults endDate to current date if not provided", async () => {
        const startDate = DateTime.now().minus({ months: 3 }).toJSDate()
        
        const kpis = await getDashboardKPIs(
            { startDate },
            util.getMockContext()
        )

        // We can't directly test the endDate since it's used internally,
        // but we can verify that the function executes successfully
        expect(kpis).toHaveProperty("currentBalance")
    })
})