import { beforeEach, describe, expect, it, vi } from "vitest"
import db from "@/src/lib/db"
import forgotPassword, { RecentPasswordResetError } from "@/src/lib/model/auth/mutations/forgotPassword"
import TestUtilityMock from "@/test/utility/TestUtilityMock"
import { forgotPasswordMailer } from "@/src/lib/mailers/forgotPasswordMailer"

// Mock dependencies
vi.mock("@/src/lib/mailers/forgotPasswordMailer", () => ({
    forgotPasswordMailer: vi.fn().mockReturnValue({
        send: vi.fn().mockResolvedValue(undefined)
    })
}))

vi.mock("@blitzjs/auth", async () => {
    const actual = await vi.importActual("@blitzjs/auth")
    return {
        ...actual,
        generateToken: vi.fn().mockReturnValue("test-token"),
        hash256: vi.fn().mockReturnValue("hashed-test-token")
    }
})

describe("forgotPassword mutation", () => {
    const utils = TestUtilityMock.getInstance()
    const testEmail = "user@example.com"

    beforeEach(async () => {
        await utils.seedDatabase()
        vi.clearAllMocks()

        // Mock db.user.findFirst
        vi.spyOn(db.user, "findFirst").mockResolvedValue({
            id: "test-user-id",
            email: testEmail,
            firstName: "Test",
            lastName: "User",
            role: "USER",
            createdAt: new Date(),
            updatedAt: new Date(),
            hashedPassword: "hashed-password"
        })

        // Mock db.token.findFirst (no existing token by default)
        vi.spyOn(db.token, "findFirst").mockResolvedValue(null)

        // Mock db.token.deleteMany and db.token.create
        vi.spyOn(db.token, "deleteMany").mockResolvedValue({ count: 0 })
        vi.spyOn(db.token, "create").mockResolvedValue({
            id: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
            hashedToken: "hashed-test-token",
            type: "RESET_PASSWORD",
            expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
            sentTo: testEmail,
            userId: "test-user-id"
        })
    })

    it("should create a new token and send an email when no recent token exists", async () => {
        await forgotPassword({ email: testEmail }, utils.getMockContext("none"))

        // Check that the token was created
        expect(db.token.create).toHaveBeenCalledWith({
            data: {
                user: { connect: { id: "test-user-id" } },
                type: "RESET_PASSWORD",
                expiresAt: expect.any(Date),
                hashedToken: "hashed-test-token",
                sentTo: testEmail
            }
        })

        // Check that the email was sent
        expect(forgotPasswordMailer).toHaveBeenCalledWith({
            to: testEmail,
            token: "test-token"
        })
    })

    it("should throw a RecentPasswordResetError when a recent token exists", async () => {
        // Mock db.token.findFirst to return a recent token
        vi.mocked(db.token.findFirst).mockResolvedValueOnce({
            id: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
            hashedToken: "existing-hashed-token",
            type: "RESET_PASSWORD",
            expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
            sentTo: testEmail,
            userId: "test-user-id"
        })

        // Expect the mutation to throw a RecentPasswordResetError
        await expect(forgotPassword({ email: testEmail }, utils.getMockContext("none"))).rejects.toThrow(RecentPasswordResetError)

        // Check that no new token was created
        expect(db.token.create).not.toHaveBeenCalled()

        // Check that no email was sent
        expect(forgotPasswordMailer).not.toHaveBeenCalled()
    })

    it("should not create a token or send an email if the user is not found", async () => {
        // Mock db.user.findFirst to return null
        vi.mocked(db.user.findFirst).mockResolvedValueOnce(null)

        await forgotPassword({ email: "nonexistent@example.com" }, utils.getMockContext("none"))

        // Check that no token was created
        expect(db.token.create).not.toHaveBeenCalled()
    })

    it("should delete existing tokens before creating a new one", async () => {
        await forgotPassword({ email: testEmail }, utils.getMockContext("none"))

        // Check that existing tokens were deleted
        expect(db.token.deleteMany).toHaveBeenCalledWith({
            where: { type: "RESET_PASSWORD", userId: "test-user-id" }
        })

        // Check that a new token was created
        expect(db.token.create).toHaveBeenCalled()
    })

    it("should set the correct expiration date on the token", async () => {
        await forgotPassword({ email: testEmail }, utils.getMockContext("none"))

        // Get the expiresAt date from the call
        const createCall = vi.mocked(db.token.create).mock.calls[0][0]
        const expiresAt = createCall.data.expiresAt as Date

        // Check that the expiration is approximately 4 hours from now
        const now = new Date()
        const fourHoursInMs = 4 * 60 * 60 * 1000
        const diff = expiresAt.getTime() - now.getTime()

        // Allow for a small difference due to test execution time
        expect(diff).toBeGreaterThan(fourHoursInMs - 1000)
        expect(diff).toBeLessThan(fourHoursInMs + 1000)
    })
})