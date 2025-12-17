import { beforeEach, describe, expect, it } from "vitest"
import TestUtilityMock from "@/test/utility/TestUtilityMock"
import updateHouseholdMember from "@/src/lib/model/household/mutations/updateHouseholdMember"
import addHouseholdMember from "@/src/lib/model/household/mutations/addHouseholdMember"
import getHousehold from "@/src/lib/model/household/queries/getHousehold"
import db from "@/src/lib/db"
import { HouseholdRole } from "@prisma/client"

describe("updateHouseholdMember mutation", () => {
    const utils = TestUtilityMock.getInstance()

    beforeEach(async () => {
        await utils.seedDatabase()
    })

    it("updates a member's role (OWNER acting)", async () => {
        const householdId = utils.getTestData().households.admin.id
        const target = utils.getTestData().users.standard

        // Add member first
        await addHouseholdMember({
            id: householdId,
            userId: target.id,
            role: HouseholdRole.MEMBER
        }, utils.getMockContext("admin"))

        const updated = await updateHouseholdMember({
            id: householdId,
            userId: target.id,
            role: HouseholdRole.ADMIN
        }, utils.getMockContext("admin"))

        expect(updated.role).toBe("ADMIN")

        const household = await getHousehold({ id: householdId }, utils.getMockContext("admin"))
        const m = household.members.find(m => m.userId === target.id)!
        expect(m.role).toBe("ADMIN")
    })

    it("prevents creating a second OWNER via update", async () => {
        const householdId = utils.getTestData().households.admin.id
        const target = utils.getTestData().users.standard

        await addHouseholdMember({
            id: householdId,
            userId: target.id,
            role: HouseholdRole.MEMBER
        }, utils.getMockContext("admin"))

        await expect(async () => updateHouseholdMember({
            id: householdId,
            userId: target.id,
            role: HouseholdRole.OWNER
        }, utils.getMockContext("admin"))).rejects.toThrow("already has an owner")
    })

    it("prevents an ADMIN from changing an OWNER's role", async () => {
        const householdId = utils.getTestData().households.admin.id
        const ownerId = utils.getTestData().users.admin.id
        const acting = utils.getTestData().users.standard

        // Make acting user ADMIN in this household
        await addHouseholdMember({
            id: householdId,
            userId: acting.id,
            role: HouseholdRole.ADMIN
        }, utils.getMockContext("admin"))

        await expect(async () => updateHouseholdMember({
            id: householdId,
            userId: ownerId,
            role: HouseholdRole.MEMBER
        }, utils.getMockContext("standard")))
            .rejects.toThrow()
    })

    it("prevents an OWNER from changing their own role", async () => {
        const householdId = utils.getTestData().households.admin.id
        const ownerId = utils.getTestData().users.admin.id

        await expect(async () => updateHouseholdMember({
            id: householdId,
            userId: ownerId,
            role: HouseholdRole.MEMBER
        }, utils.getMockContext("admin")))
            .rejects.toThrow("Owners cannot change their own role")
    })
})
