import { beforeEach, describe, expect, it } from "vitest"
import TestUtilityMock from "@/test/utility/TestUtilityMock"
import setDefaultAccount from "@/src/lib/model/household/mutations/setDefaultAccount"
import getCurrentMembership from "@/src/lib/model/household/queries/getCurrentMembership"
import createAccount from "@/src/lib/model/account/mutations/createAccount"
import db from "@/src/lib/db"

describe("setDefaultAccount mutation", () => {
    const utils = TestUtilityMock.getInstance()

    beforeEach(async () => {
        await utils.seedDatabase()
    })

    it("sets a default account for the current user", async () => {
        const householdId = utils.getTestData().households.standard.id
        const accountId = utils.getTestData().accounts.standard.id

        const result = await setDefaultAccount({
            householdId,
            accountId
        }, utils.getMockContext("standard"))

        expect(result.defaultAccountId).toBe(accountId)

        // Verify via query
        const membership = await getCurrentMembership({ householdId }, utils.getMockContext("standard"))
        expect(membership?.defaultAccountId).toBe(accountId)
    })

    it("clears the default account when accountId is null", async () => {
        const householdId = utils.getTestData().households.standard.id
        const accountId = utils.getTestData().accounts.standard.id

        // First set a default
        await setDefaultAccount({
            householdId,
            accountId
        }, utils.getMockContext("standard"))

        // Then clear it
        const result = await setDefaultAccount({
            householdId,
            accountId: null
        }, utils.getMockContext("standard"))

        expect(result.defaultAccountId).toBeNull()
    })

    it("allows switching default account", async () => {
        const householdId = utils.getTestData().households.standard.id
        const firstAccountId = utils.getTestData().accounts.standard.id

        // Create a second account
        const secondAccount = await createAccount({
            name: "Second Account",
            householdId,
            technicalIdentifier: "second_account"
        }, utils.getMockContext("standard"))

        // Set first account as default
        await setDefaultAccount({
            householdId,
            accountId: firstAccountId
        }, utils.getMockContext("standard"))

        // Switch to second account
        const result = await setDefaultAccount({
            householdId,
            accountId: secondAccount.id
        }, utils.getMockContext("standard"))

        expect(result.defaultAccountId).toBe(secondAccount.id)
    })

    it("fails when user is not a member of the household", async () => {
        const householdId = utils.getTestData().households.admin.id
        const accountId = utils.getTestData().accounts.admin.id

        await expect(async () => setDefaultAccount({
            householdId,
            accountId
        }, utils.getMockContext("standard"))).rejects.toThrow("Membership not found")
    })

    it("fails when account does not belong to the household", async () => {
        const householdId = utils.getTestData().households.standard.id
        const wrongAccountId = utils.getTestData().accounts.admin.id

        await expect(async () => setDefaultAccount({
            householdId,
            accountId: wrongAccountId
        }, utils.getMockContext("standard"))).rejects.toThrow("Account not found in this household")
    })

    it("fails when account does not exist", async () => {
        const householdId = utils.getTestData().households.standard.id

        await expect(async () => setDefaultAccount({
            householdId,
            accountId: "00000000-0000-0000-0000-000000000000"
        }, utils.getMockContext("standard"))).rejects.toThrow("Account not found in this household")
    })

    it("fails when user is not authenticated", async () => {
        const householdId = utils.getTestData().households.standard.id
        const accountId = utils.getTestData().accounts.standard.id

        await expect(async () => setDefaultAccount({
            householdId,
            accountId
        }, utils.getMockContext("none"))).rejects.toThrow()
    })
})
