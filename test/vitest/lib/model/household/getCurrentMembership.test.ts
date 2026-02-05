import { beforeEach, describe, expect, it } from "vitest"
import TestUtilityMock from "@/test/utility/TestUtilityMock"
import getCurrentMembership from "@/src/lib/model/household/queries/getCurrentMembership"
import setDefaultAccount from "@/src/lib/model/household/mutations/setDefaultAccount"

describe("getCurrentMembership query", () => {
    const utils = TestUtilityMock.getInstance()

    beforeEach(async () => {
        await utils.seedDatabase()
    })

    it("returns the current user's membership for a household", async () => {
        const householdId = utils.getTestData().households.standard.id
        const userId = utils.getTestData().users.standard.id

        const membership = await getCurrentMembership({ householdId }, utils.getMockContext("standard"))

        expect(membership).not.toBeNull()
        expect(membership?.userId).toBe(userId)
        expect(membership?.householdId).toBe(householdId)
    })

    it("returns null when user is not a member of the household", async () => {
        const householdId = utils.getTestData().households.admin.id

        const membership = await getCurrentMembership({ householdId }, utils.getMockContext("standard"))

        expect(membership).toBeNull()
    })

    it("includes defaultAccountId when set", async () => {
        const householdId = utils.getTestData().households.standard.id
        const accountId = utils.getTestData().accounts.standard.id

        // Set a default account first
        await setDefaultAccount({
            householdId,
            accountId
        }, utils.getMockContext("standard"))

        const membership = await getCurrentMembership({ householdId }, utils.getMockContext("standard"))

        expect(membership?.defaultAccountId).toBe(accountId)
    })

    it("includes defaultAccount relation when set", async () => {
        const householdId = utils.getTestData().households.standard.id
        const accountId = utils.getTestData().accounts.standard.id

        // Set a default account first
        await setDefaultAccount({
            householdId,
            accountId
        }, utils.getMockContext("standard"))

        const membership = await getCurrentMembership({ householdId }, utils.getMockContext("standard"))

        expect(membership?.defaultAccount).not.toBeNull()
        expect(membership?.defaultAccount?.id).toBe(accountId)
    })

    it("returns null defaultAccountId when not set", async () => {
        const householdId = utils.getTestData().households.standard.id

        const membership = await getCurrentMembership({ householdId }, utils.getMockContext("standard"))

        expect(membership?.defaultAccountId).toBeNull()
    })

    it("fails when user is not authenticated", async () => {
        const householdId = utils.getTestData().households.standard.id

        await expect(async () => getCurrentMembership({ householdId }, utils.getMockContext("none")))
            .rejects.toThrow()
    })
})
