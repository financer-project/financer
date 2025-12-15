import { beforeEach, describe, expect, it } from "vitest"
import TestUtilityMock from "@/test/utility/TestUtilityMock"
import addHouseholdMember from "@/src/lib/model/household/mutations/addHouseholdMember"
import db from "@/src/lib/db"
import { AccessLevel, HouseholdRole } from "@prisma/client"

describe("addHouseholdMember (ID-based) mutation", () => {
    const utils = TestUtilityMock.getInstance()

    beforeEach(async () => {
        await utils.seedDatabase()
    })

    it("adds a new membership successfully", async () => {
        const householdId = utils.getTestData().households.admin.id // admin is OWNER here
        const userToAdd = utils.getTestData().users.standard // not member of admin household yet

        const result = await addHouseholdMember({
            id: householdId,
            userId: userToAdd.id,
            role: HouseholdRole.MEMBER,
            accessLevel: AccessLevel.FULL
        }, utils.getMockContext("admin"))

        expect(result).toBeTruthy()

        const membership = await db.householdMembership.findFirst({ where: { householdId, userId: userToAdd.id } })
        expect(membership).not.toBeNull()
        expect(membership!.role).toBe("MEMBER")
        expect(membership!.accessLevel).toBe("FULL")
    })

    it("is idempotent when adding the same member twice", async () => {
        const householdId = utils.getTestData().households.admin.id
        const userToAdd = utils.getTestData().users.standard

        await addHouseholdMember({
            id: householdId,
            userId: userToAdd.id,
            role: HouseholdRole.MEMBER,
            accessLevel: AccessLevel.FULL
        }, utils.getMockContext("admin"))

        await addHouseholdMember({
            id: householdId,
            userId: userToAdd.id,
            role: HouseholdRole.MEMBER,
            accessLevel: AccessLevel.FULL
        }, utils.getMockContext("admin"))

        const count = await db.householdMembership.count({ where: { householdId, userId: userToAdd.id } })
        expect(count).toBe(1)
    })

    it("prevents adding a second OWNER to the household", async () => {
        const householdId = utils.getTestData().households.admin.id
        const userToAdd = utils.getTestData().users.standard

        await expect(async () => addHouseholdMember({
            id: householdId,
            userId: userToAdd.id,
            role: HouseholdRole.OWNER,
            accessLevel: AccessLevel.FULL
        }, utils.getMockContext("admin"))).rejects.toThrow()
    })

    it("throws when household does not exist", async () => {
        const userToAdd = utils.getTestData().users.standard
        await expect(async () => addHouseholdMember({
            id: "00000000-0000-0000-0000-000000000000",
            userId: userToAdd.id,
            role: HouseholdRole.MEMBER,
            accessLevel: AccessLevel.FULL
        }, utils.getMockContext("admin"))).rejects.toThrow()
    })

    it("enforces authorization: non-authorized user cannot add to a household", async () => {
        const householdId = utils.getTestData().households.admin.id // owned by admin user
        const userToAdd = utils.getTestData().users.standard

        await expect(async () => addHouseholdMember({
            id: householdId,
            userId: userToAdd.id,
            role: HouseholdRole.MEMBER,
            accessLevel: AccessLevel.FULL
        }, utils.getMockContext("standard"))) // not owner/admin of this household
            .rejects.toThrow()
    })
})
