import { beforeEach, describe, expect, test } from "vitest"
import TestUtilityMock from "@/test/utility/TestUtilityMock"
import { DateTime } from "luxon"
import getBalanceHistory from "@/src/lib/model/transactions/queries/getBalanceHistory"
import db from "@/src/lib/db"

describe("Get Balance History", () => {
    const util = TestUtilityMock.getInstance()

    beforeEach(async () => {
        await util.seedDatabase()
    })

    test("returns income and expenses grouped by month", async () => {
        const startDate = DateTime.now().minus({ months: 2 }).toJSDate()
        const endDate = DateTime.now().toJSDate()

        const balanceHistory = await getBalanceHistory(
            { startDate, endDate },
            util.getMockContext()
        )

        expect(balanceHistory).toBeInstanceOf(Array)
        expect(balanceHistory.length).toBeGreaterThan(0)

        balanceHistory.forEach((entry) => {
            expect(entry).toHaveProperty("month")
            expect(entry).toHaveProperty("income")
            expect(entry).toHaveProperty("expenses")
            expect(entry.month).toBeInstanceOf(Date)
            expect(typeof entry.income).toBe("number")
            expect(typeof entry.expenses).toBe("number")
        })

        const firstMonth = balanceHistory[0]
        expect(firstMonth.income).toBeGreaterThanOrEqual(0)
        expect(firstMonth.expenses).toBeLessThanOrEqual(0)
    })

    test("returns array with empty values when no transactions exist", async () => {
        db.transaction.deleteMany({});

        const startDate = DateTime.now().minus({ months: 1 }).toJSDate()
        const endDate = DateTime.now().toJSDate()

        const balanceHistory = await getBalanceHistory(
            { startDate, endDate },
            util.getMockContext()
        )

        expect(balanceHistory).toBeInstanceOf(Array)
        expect(balanceHistory).toHaveLength(2)
        expect(balanceHistory[0].income).toBe(0)
        expect(balanceHistory[0].expenses).toBe(0)
    })

    test("throws error if startDate is invalid or in future", async () => {
        const invalidStartDate = DateTime.now().plus({ months: 1 }).toJSDate()

        await expect(() =>
            getBalanceHistory({ startDate: invalidStartDate }, util.getMockContext())
        ).rejects.toThrowError()
    })

    test("defaults endDate to current date if not provided", async () => {
        const startDate = DateTime.now().minus({ months: 3 }).toJSDate()

        const today = new Date()

        const balanceHistory = await getBalanceHistory(
            { startDate },
            util.getMockContext()
        )

        expect(balanceHistory).toBeInstanceOf(Array)

        expect(balanceHistory[balanceHistory.length - 1].month).toEqual(
            DateTime.fromJSDate(today).startOf("month").toJSDate()
        )
    })
})
