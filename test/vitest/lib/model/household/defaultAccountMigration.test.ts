import { beforeEach, describe, expect, it } from "vitest"
import TestUtilityMock from "@/test/utility/TestUtilityMock"
import db from "@/src/lib/db"
import deleteAccount from "@/src/lib/model/account/mutations/deleteAccount"
import setDefaultAccount from "@/src/lib/model/household/mutations/setDefaultAccount"
import getCurrentMembership from "@/src/lib/model/household/queries/getCurrentMembership"
import createAccount from "@/src/lib/model/account/mutations/createAccount"

describe("Default Account Migration", () => {
    const utils = TestUtilityMock.getInstance()

    beforeEach(async () => {
        await utils.seedDatabase()
    })

    describe("Schema Structure", () => {
        it("HouseholdMembership has defaultAccountId field", async () => {
            const householdId = utils.getTestData().households.standard.id
            const userId = utils.getTestData().users.standard.id

            const membership = await db.householdMembership.findFirst({
                where: { householdId, userId }
            })

            expect(membership).not.toBeNull()
            expect("defaultAccountId" in membership!).toBe(true)
        })

        it("Account has defaultForMemberships relation", async () => {
            const accountId = utils.getTestData().accounts.standard.id

            const account = await db.account.findFirst({
                where: { id: accountId },
                include: { defaultForMemberships: true }
            })

            expect(account).not.toBeNull()
            expect(Array.isArray(account!.defaultForMemberships)).toBe(true)
        })
    })

    describe("Referential Integrity", () => {
        it("defaultAccountId references a valid Account", async () => {
            const householdId = utils.getTestData().households.standard.id
            const accountId = utils.getTestData().accounts.standard.id

            await setDefaultAccount({
                householdId,
                accountId
            }, utils.getMockContext("standard"))

            const membership = await db.householdMembership.findFirst({
                where: { householdId, userId: utils.getTestData().users.standard.id },
                include: { defaultAccount: true }
            })

            expect(membership?.defaultAccount).not.toBeNull()
            expect(membership?.defaultAccount?.id).toBe(accountId)
        })

        it("deleting default account sets defaultAccountId to null (onDelete: SetNull)", async () => {
            const householdId = utils.getTestData().households.standard.id

            // Create a new account to delete (so we don't break other tests)
            const newAccount = await createAccount({
                name: "Account to Delete",
                householdId,
                technicalIdentifier: "delete_me"
            }, utils.getMockContext("standard"))

            // Set it as default
            await setDefaultAccount({
                householdId,
                accountId: newAccount.id
            }, utils.getMockContext("standard"))

            // Verify it's set
            let membership = await getCurrentMembership({ householdId }, utils.getMockContext("standard"))
            expect(membership?.defaultAccountId).toBe(newAccount.id)

            // Delete the account
            await deleteAccount({ id: newAccount.id }, utils.getMockContext("standard"))

            // Verify defaultAccountId is now null
            membership = await getCurrentMembership({ householdId }, utils.getMockContext("standard"))
            expect(membership?.defaultAccountId).toBeNull()
        })
    })

    describe("Multi-user Isolation", () => {
        it("different users can have different default accounts in the same household", async () => {
            const householdId = utils.getTestData().households.standard.id
            const accountId = utils.getTestData().accounts.standard.id

            // Create a second account
            const secondAccount = await createAccount({
                name: "Second Account",
                householdId,
                technicalIdentifier: "second"
            }, utils.getMockContext("standard"))

            // Add admin user to standard household
            await db.householdMembership.create({
                data: {
                    userId: utils.getTestData().users.admin.id,
                    householdId,
                    role: "MEMBER"
                }
            })

            // Standard user sets first account as default
            await setDefaultAccount({
                householdId,
                accountId
            }, utils.getMockContext("standard"))

            // Admin user sets second account as default
            await setDefaultAccount({
                householdId,
                accountId: secondAccount.id
            }, utils.getMockContext("admin"))

            // Verify each user has their own default
            const standardMembership = await getCurrentMembership({ householdId }, utils.getMockContext("standard"))
            const adminMembership = await getCurrentMembership({ householdId }, utils.getMockContext("admin"))

            expect(standardMembership?.defaultAccountId).toBe(accountId)
            expect(adminMembership?.defaultAccountId).toBe(secondAccount.id)
        })
    })
})
