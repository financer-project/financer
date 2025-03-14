import { describe, expect, test } from "vitest"
import createHousehold from "@/src/lib/model/household/mutations/createHousehold"
import updateHousehold from "@/src/lib/model/household/mutations/updateHousehold"
import TestUtilityFactory from "@/test/utility/TestUtilityFactory"
import deleteHousehold from "@/src/lib/model/household/mutations/deleteHousehold"
import getHousehold from "@/src/lib/model/household/queries/getHousehold"
import getHouseholds from "@/src/lib/model/household/queries/getHouseholds"
import changeCurrentHousehold from "@/src/lib/model/household/mutations/changeCurrentHousehold"
import getCurrentHousehold from "@/src/lib/model/household/queries/getCurrentHousehold"

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

    describe("getCurrentHousehold", () => {
        test("returns the current household for a user", async () => {
            const ctx = util.getMockContext()
            const household = await getCurrentHousehold(null, ctx)

            expect(household).not.toBeNull()
            expect(household?.ownerId).toBe(ctx.session.userId)
        })

        test("throws exception when no user is authenticated", async () => {
            const ctx = util.getMockContext("none")
            await expect(async () => getCurrentHousehold(null, ctx))
                .rejects.toThrowError()
        })

        test("finds next household when current household id is not set", async () => {
            const ctx = util.getMockContext("standard", { currentHouseholdId: null })
            const household = await getCurrentHousehold(null, ctx)

            expect(household).not.toBeNull()
            expect(household?.ownerId).toBe(ctx.session.userId)
        })

        test("finds next household when current household doesn't exist anymore", async () => {
            const ctx = util.getMockContext("standard", { currentHouseholdId: "non-existent-id" })
            const household = await getCurrentHousehold(null, ctx)

            expect(household).not.toBeNull()
            expect(household?.ownerId).toBe(ctx.session.userId)
        })
    })

    describe("changeCurrentHousehold", () => {
        test("changes the current household successfully", async () => {
            const context = util.getMockContext()

            // Erstelle ein neues Household zuerst
            const newHousehold = await createHousehold({
                name: "Second Household",
                currency: "EUR",
                description: "Test Second Household"
            }, context)

            // Ändere zu diesem Household
            const result = await changeCurrentHousehold({
                id: newHousehold.id
            }, context)

            expect(result.id).toBe(newHousehold.id)

            // Bestätige, dass das aktuelle Household geändert wurde
            const currentHousehold = await getCurrentHousehold(null, context)
            expect(currentHousehold?.id).toBe(newHousehold.id)
        })

        test("throws error when household doesn't exist", async () => {
            await expect(async () => changeCurrentHousehold({
                id: "00000000-0000-0000-0000-000000000000"
            }, util.getMockContext()))
                .rejects.toThrowError()
        })

        test("validates the household id", async () => {
            await expect(async () => changeCurrentHousehold({
                // @ts-ignore
                id: "invalid-uuid"
            }, util.getMockContext()))
                .rejects.toThrowError()
        })
    })
})
