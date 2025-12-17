import { beforeEach, describe, expect, it } from "vitest"
import TestUtilityMock from "@/test/utility/TestUtilityMock"
import removeHouseholdMember from "@/src/lib/model/household/mutations/removeHouseholdMember"
import addHouseholdMember from "@/src/lib/model/household/mutations/addHouseholdMember"
import getHousehold from "@/src/lib/model/household/queries/getHousehold"
import db from "@/src/lib/db"
import { HouseholdRole } from "@prisma/client"

describe("removeHouseholdMember mutation", () => {
    const utils = TestUtilityMock.getInstance()

    beforeEach(async () => {
        await utils.seedDatabase()
    })

    it("removes a member successfully (OWNER acting)", async () => {
        const householdId = utils.getTestData().households.admin.id
        const target = utils.getTestData().users.standard

        // Add the member first
        await addHouseholdMember({
            id: householdId,
            userId: target.id,
            role: HouseholdRole.MEMBER
        }, utils.getMockContext("admin"))

        const result = await removeHouseholdMember({ id: householdId, userId: target.id }, utils.getMockContext("admin"))
        expect(result).toBe(true)

        const membership = await db.householdMembership.findFirst({ where: { householdId, userId: target.id } })
        expect(membership).toBeNull()

        const household = await getHousehold({ id: householdId }, utils.getMockContext("admin"))
        expect(household.members.find(m => m.userId === target.id)).toBeUndefined()
    })

    it("prevents removing the last OWNER", async () => {
        const householdId = utils.getTestData().households.admin.id
        const ownerId = utils.getTestData().users.admin.id

        await expect(async () => removeHouseholdMember({ id: householdId, userId: ownerId }, utils.getMockContext("admin")))
            .rejects.toThrow("Cannot remove the last owner")
    })

    it("prevents a non-owner from removing an OWNER", async () => {
        const householdId = utils.getTestData().households.admin.id
        const ownerId = utils.getTestData().users.admin.id

        // Acting user is not an owner in this household (we make them ADMIN to pass basic auth but still fail owner removal rule)
        const acting = utils.getTestData().users.standard
        await addHouseholdMember({
            id: householdId,
            userId: acting.id,
            role: HouseholdRole.ADMIN
        }, utils.getMockContext("admin"))

        await expect(async () => removeHouseholdMember({ id: householdId, userId: ownerId }, utils.getMockContext("standard")))
            .rejects.toThrow()
    })
})
