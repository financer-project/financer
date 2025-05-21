import { describe, expect, test } from "vitest"
import createAccount from "@/src/lib/model/account/mutations/createAccount"
import updateAccount from "@/src/lib/model/account/mutations/updateAccount"
import deleteAccount from "@/src/lib/model/account/mutations/deleteAccount"
import getAccount from "@/src/lib/model/account/queries/getAccount"
import getAccounts from "@/src/lib/model/account/queries/getAccounts"
import TestUtilityMock from "@/test/utility/TestUtilityMock"

describe("Account Mutations & Queries", () => {
    const util = TestUtilityMock.getInstance()

    beforeEach(async () => {
        await util.seedDatabase()
    })

    describe("get", () => {
        test("get all accounts for a household", async () => {
            const { accounts } = await getAccounts({ householdId: util.getTestData().households.standard.id }, util.getMockContext())
            expect(accounts).toHaveLength(1)
        })

        test("get specific account by ID", async () => {
            const account = await getAccount({ id: util.getTestData().accounts.standard.id }, util.getMockContext())
            expect(account.id).toBe(util.getTestData().accounts.standard.id)
        })
    })

    describe("create", () => {
        test("creates a new account successfully", async () => {
            const result = await createAccount({
                name: "Test Account",
                householdId: util.getTestData().households.standard.id,
                technicalIdentifier: "test_account"
            }, util.getMockContext())

            expect(result.id).not.toBeUndefined()
            expect(result.name).toBe("Test Account")
            expect(result.technicalIdentifier).toBe("test_account")
        })

        test("creates a new account with invalid data", async () => {
            await expect(async () => createAccount({
                name: "",
                householdId: util.getTestData().households.standard.id,
                technicalIdentifier: null
            }, util.getMockContext())).rejects.toThrowError()
        })
    })

    describe("update", () => {
        test("updates an account successfully", async () => {
            const result = await updateAccount({
                id: util.getTestData().accounts.standard.id,
                householdId: util.getTestData().households.standard.id,
                name: "Updated Account Name",
                technicalIdentifier: "updated_technical"
            }, util.getMockContext())

            expect(result.name).toBe("Updated Account Name")
            expect(result.technicalIdentifier).toBe("updated_technical")
        })

        test("fails to update non-existing account", async () => {
            await expect(async () => updateAccount({
                id: "non-existent-id",
                householdId: util.getTestData().households.standard.id,
                name: "Invalid Update",
                technicalIdentifier: null
            }, util.getMockContext())).rejects.toThrowError()
        })
    })

    describe("delete", () => {
        test("deletes an account successfully", async () => {
            const result = await deleteAccount({ id: util.getTestData().accounts.standard.id }, util.getMockContext())
            expect(result.count).toBe(1)
            await expect(async () => getAccount({ id: util.getTestData().accounts.standard.id }, util.getMockContext()))
                .rejects.toThrowError()
        })

        test("fails to delete non-existing account", async () => {
            const result = await deleteAccount({ id: "non-existent-id" }, util.getMockContext())
            expect(result.count).toBe(0)
        })
    })
})
