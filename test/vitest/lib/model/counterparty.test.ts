import { describe, expect, test } from "vitest"
import TestUtilityMock from "@/test/utility/TestUtilityMock"
import getCounterparties from "@/src/lib/model/counterparties/queries/getCounterparties"
import createCounterparty from "@/src/lib/model/counterparties/mutations/createCounterparty"
import getCounterparty from "@/src/lib/model/counterparties/queries/getCounterparty"
import updateCounterparty from "@/src/lib/model/counterparties/mutations/updateCounterparty"
import deleteCounterparty from "@/src/lib/model/counterparties/mutations/deleteCounterparty"
import { CounterpartyType } from "@prisma/client"

describe("Counterparty Mutations & Queries", () => {
    const util = TestUtilityMock.getInstance()

    beforeEach(async () => {
        await util.seedDatabase()
    })

    describe("get", () => {
        test("get all counterparties for a household", async () => {
            const result = await getCounterparties({ 
                householdId: util.getTestData().households.standard.id 
            }, util.getMockContext())

            expect(result.counterparties.length).toBeGreaterThan(0)
            // Check if one of the seeded counterparties is in the result
            const merchantCounterparty = util.getTestData().counterparties.standard.merchant
            const foundCounterparty = result.counterparties.find(c => c.id === merchantCounterparty.id)
            expect(foundCounterparty).not.toBeUndefined()
            expect(foundCounterparty?.name).toBe(merchantCounterparty.name)
        })

        test("get specific counterparty by ID", async () => {
            const merchantCounterparty = util.getTestData().counterparties.standard.merchant

            const result = await getCounterparty({ 
                id: merchantCounterparty.id
            }, util.getMockContext())

            expect(result.id).toBe(merchantCounterparty.id)
            expect(result.name).toBe(merchantCounterparty.name)
        })
    })

    describe("create", () => {
        test("creates a new counterparty successfully", async () => {
            const result = await createCounterparty({
                name: "Test Counterparty",
                householdId: util.getTestData().households.standard.id,
                type: CounterpartyType.MERCHANT,
                description: "Test description",
                accountName: null,
                webAddress: null
            }, util.getMockContext())

            expect(result.id).not.toBeUndefined()
            expect(result.name).toBe("Test Counterparty")
            expect(result.type).toBe(CounterpartyType.MERCHANT)
            expect(result.householdId).toBe(util.getTestData().households.standard.id)
        })

        test("creates a new counterparty with all fields", async () => {
            const result = await createCounterparty({
                name: "Full Counterparty",
                householdId: util.getTestData().households.standard.id,
                type: CounterpartyType.SERVICE_PROVIDER,
                description: "Full description",
                accountName: "Account Name",
                webAddress: "https://example.com"
            }, util.getMockContext())

            expect(result.id).not.toBeUndefined()
            expect(result.name).toBe("Full Counterparty")
            expect(result.type).toBe(CounterpartyType.SERVICE_PROVIDER)
            expect(result.description).toBe("Full description")
            expect(result.accountName).toBe("Account Name")
            expect(result.webAddress).toBe("https://example.com")
        })
    })

    describe("update", () => {
        test("updates a counterparty successfully", async () => {
            const employerCounterparty = util.getTestData().counterparties.standard.employer

            const result = await updateCounterparty({
                id: employerCounterparty.id,
                householdId: util.getTestData().households.standard.id,
                name: "Updated Counterparty Name",
                type: CounterpartyType.INDIVIDUAL,
                description: "Updated description",
                accountName: "Updated Account",
                webAddress: "https://updated.com"
            }, util.getMockContext())

            expect(result.name).toBe("Updated Counterparty Name")
            expect(result.type).toBe(CounterpartyType.INDIVIDUAL)
            expect(result.description).toBe("Updated description")
            expect(result.accountName).toBe("Updated Account")
            expect(result.webAddress).toBe("https://updated.com")
        })

        test("fails to update non-existing counterparty", async () => {
            await expect(async () => updateCounterparty({
                id: "non-existent-id",
                householdId: util.getTestData().households.standard.id,
                name: "Invalid Update",
                type: CounterpartyType.MERCHANT,
                description: null,
                accountName: null,
                webAddress: null
            }, util.getMockContext())).rejects.toThrowError()
        })

        test("fails to update counterparty from different household", async () => {
            const utilityCounterparty = util.getTestData().counterparties.standard.utility

            await expect(async () => updateCounterparty({
                id: utilityCounterparty.id,
                householdId: "different-household-id", // Different household ID
                name: "Updated Counterparty Name",
                type: CounterpartyType.INDIVIDUAL,
                description: "Updated description",
                accountName: null,
                webAddress: null
            }, util.getMockContext())).rejects.toThrowError()
        })
    })

    describe("delete", () => {
        test("deletes a counterparty successfully", async () => {
            // Create a new counterparty for deletion test
            // We don't want to delete the seed data as it might be used by other tests
            const counterparty = await createCounterparty({
                name: "Counterparty To Delete",
                householdId: util.getTestData().households.standard.id,
                type: CounterpartyType.MERCHANT,
                description: "This counterparty will be deleted",
                accountName: null,
                webAddress: null
            }, util.getMockContext())

            await deleteCounterparty({ 
                id: counterparty.id
            }, util.getMockContext())

            await expect(async () => getCounterparty({ 
                id: counterparty.id
            }, util.getMockContext())).rejects.toThrowError()
        })

        test("fails to delete non-existing counterparty", async () => {
            await expect(async () => deleteCounterparty({ 
                id: "non-existent-id"
            }, util.getMockContext())).rejects.toThrowError()
        })
    })
})
