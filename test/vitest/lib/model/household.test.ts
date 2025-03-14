import { describe, expect, test } from "vitest"
import createHousehold from "@/src/lib/model/household/mutations/createHousehold"
import updateHousehold from "@/src/lib/model/household/mutations/updateHousehold"
import TestUtilityFactory from "@/test/utility/TestUtilityFactory"
import deleteHousehold from "@/src/lib/model/household/mutations/deleteHousehold"
import getHousehold from "@/src/lib/model/household/queries/getHousehold"
import getHouseholds from "@/src/lib/model/household/queries/getHouseholds"

describe("Household Mutations & Queries", () => {

    const util = TestUtilityFactory.mock()

    beforeEach(async () => {
        await util.seedDatabase()
    })

    describe("get", () => {
        test("get all households", async () => {
            const { households } = await getHouseholds({}, util.getMockContext())
            expect(households).toHaveLength(1)
        })
    })

    describe("create", () => {
        test("creates a new household successfully", async () => {
            const result = await createHousehold({
                name: "Test Household",
                currency: "USD",
                description: "Test Household"
            }, util.getMockContext())

            expect(result.id).not.toBeUndefined()
        })

        test("creates a new household with wrong data", async () => {
            await expect(async () => createHousehold({
                name: "",
                currency: "USD",
                description: null
            }, util.getMockContext()))
                .rejects.toThrowError("String must contain at least 3 character(s)")
        })
    })

    describe("update", () => {
        test("updates a new household successfully", async () => {
            const result = await updateHousehold({
                id: util.getTestData().households.standard.id,
                name: "Test Household (updated)",
                currency: "EUR",
                description: null
            }, util.getMockContext())

            expect(result.name).toBe("Test Household (updated)")
            expect(result.currency).toBe("EUR")
        })
    })

    describe("delete", () => {
        test("deletes a new household successfully", async () => {
            await deleteHousehold({ id: util.getTestData().households.standard.id }, util.getMockContext())
            await expect(async () => getHousehold({ id: util.getTestData().households.standard.id }, util.getMockContext()))
                .rejects.toThrowError()
        })
    })
})
