import { beforeEach, describe, expect, it, vi } from "vitest"
import addOrInviteHouseholdMember from "@/src/lib/model/household/mutations/addOrInviteHouseholdMember"
import TestUtilityMock from "@/test/utility/TestUtilityMock"
import db from "@/src/lib/db"
import { HouseholdRole } from "@prisma/client"

// Mock mailers
vi.mock("@/src/lib/mailers/invitationMailer", () => ({
    invitationMailer: vi.fn().mockReturnValue({ send: vi.fn().mockResolvedValue(undefined) })
}))

vi.mock("@/src/lib/mailers/notificationMailer", () => ({
    notificationMailer: vi.fn().mockReturnValue({ send: vi.fn().mockResolvedValue(undefined) })
}))

// Mock token generation
vi.mock("@blitzjs/auth", async () => {
    const actual = await vi.importActual("@blitzjs/auth")
    return {
        ...actual,
        generateToken: vi.fn().mockReturnValue("test-token"),
        hash256: vi.fn().mockReturnValue("hashed-test-token")
    }
})

describe("addOrInviteHouseholdMember mutation", () => {
    const utils = TestUtilityMock.getInstance()

    beforeEach(async () => {
        await utils.seedDatabase()
        vi.clearAllMocks()
        // Spy on token operations for invitation flow
        vi.spyOn(db.token, "deleteMany").mockResolvedValue({ count: 0 })
        vi.spyOn(db.token, "create").mockResolvedValue({
            id: "id",
            createdAt: new Date(),
            updatedAt: new Date(),
            hashedToken: "hashed-test-token",
            type: "INVITATION",
            expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
            sentTo: "invitee@example.com",
            userId: utils.getTestData().users.admin.id
        } as any)
    })

    it("adds an existing user to a household and sends notification", async () => {
        const adminHouseholdId = utils.getTestData().households.admin.id
        const targetUser = utils.getTestData().users.standard

        const result = await addOrInviteHouseholdMember({
            id: adminHouseholdId,
            email: targetUser.email,
            role: HouseholdRole.MEMBER
        }, utils.getMockContext("admin"))

        expect(result).toBeTruthy()
        // membership created
        const membership = await db.householdMembership.findFirst({ where: { householdId: adminHouseholdId, userId: targetUser.id } })
        expect(membership).not.toBeNull()

        // notification mailer invoked
        const { notificationMailer } = await import("@/src/lib/mailers/notificationMailer")
        expect(notificationMailer).toHaveBeenCalled()
    })

    it("invites a non-existing user then sends notification without creating membership", async () => {
        const adminHouseholdId = utils.getTestData().households.admin.id
        const email = "invitee@example.com"

        const result: any = await addOrInviteHouseholdMember({
            id: adminHouseholdId,
            email,
            role: HouseholdRole.MEMBER
        }, utils.getMockContext("admin"))

        // Indicates invitation was sent
        expect(result).toEqual({ invited: true })

        // Check token handling for invitation
        expect(db.token.deleteMany).toHaveBeenCalledWith({ where: { type: "INVITATION_HOUSEHOLD", sentTo: email } })
        expect(db.token.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ sentTo: email, type: "INVITATION_HOUSEHOLD", content: expect.objectContaining({ householdId: adminHouseholdId }) }) }))

        // Mailers called in correct order (we can only assert both were called)
        const { invitationMailer } = await import("@/src/lib/mailers/invitationMailer")
        const { notificationMailer } = await import("@/src/lib/mailers/notificationMailer")
        expect(invitationMailer).toHaveBeenCalled()
        expect(notificationMailer).toHaveBeenCalled()

        // No membership created for unknown email
        const membership = await db.householdMembership.findFirst({ where: { householdId: adminHouseholdId, user: { email } } as any })
        expect(membership).toBeNull()
    })
})
