import { beforeEach, describe, expect, it, vi } from "vitest"
import db from "@/src/lib/db"
import inviteUser, { UserAlreadyRegisteredError } from "@/src/lib/model/auth/mutations/inviteUser"
import TestUtilityMock from "@/test/utility/TestUtilityMock"
import { invitationMailer } from "@/src/lib/mailers/invitationMailer"
import { generateToken, hash256 } from "@blitzjs/auth"
import { User } from "@prisma/client"

// Mock dependencies
vi.mock("@/src/lib/mailers/invitationMailer", () => ({
    invitationMailer: vi.fn().mockReturnValue({
        send: vi.fn().mockResolvedValue(undefined)
    })
}))

vi.mock("@/src/lib/model/settings/queries/getAdminSettings", () => ({
    default: vi.fn().mockResolvedValue({
        smtpHost: "smtp.test.com",
        smtpPort: 587,
        smtpUser: "test@test.com",
        smtpPassword: "password",
        smtpFromEmail: "noreply@test.com",
        smtpFromName: "Test App",
        smtpEncryption: "tls",
        allowRegistration: true,
        invitationTokenExpirationHours: 72,
        resetPasswordTokenExpirationHours: 4
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

describe("inviteUser mutation", () => {
    const utils = TestUtilityMock.getInstance()

    beforeEach(async () => {
        await utils.seedDatabase()
        vi.clearAllMocks()

        // Mock db.token.deleteMany and db.token.create
        vi.spyOn(db.token, "deleteMany").mockResolvedValue({ count: 0 })
        vi.spyOn(db.token, "create").mockResolvedValue({
            id: "id",
            createdAt: new Date(),
            updatedAt: new Date(),
            hashedToken: "hashed-test-token",
            type: "INVITATION",
            expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000), // 3 days from now
            sentTo: "test@example.com",
            userId: utils.getTestData().users.admin.id
        })
    })

    it("should successfully invite a user", async () => {
        const result = await inviteUser(
            { email: "test@example.com" },
            utils.getMockContext("admin")
        )

        // Check that the result is successful
        expect(result).toEqual({ success: true })

        // Check that the token was deleted and created
        expect(db.token.deleteMany).toHaveBeenCalledWith({
            where: { type: "INVITATION", sentTo: "test@example.com" }
        })

        expect(db.token.create).toHaveBeenCalledWith({
            data: {
                userId: utils.getTestData().users.admin.id,
                sentTo: "test@example.com",
                type: "INVITATION",
                hashedToken: "hashed-test-token",
                expiresAt: expect.any(Date)
            }
        })

        // Check that the email was sent
        expect(invitationMailer).toHaveBeenCalledWith({
            to: "test@example.com",
            token: "test-token",
            inviterName: expect.any(String)
        })
    })

    it("should throw an error if the user is not an admin", async () => {
        await expect(
            inviteUser(
                { email: "test@example.com" },
                utils.getMockContext("standard")
            )
        ).rejects.toThrow()
    })

    it("should throw an error if the inviter user is not found", async () => {
        // Mock db.user.findFirst to return null for the inviter user lookup
        // and a mock user for the existing user check
        vi.spyOn(db.user, "findFirst").mockImplementation((args) => {
            // For the existing user check (first call)
            if (args?.where?.email === "test@example.com") {
                return Promise.resolve(null)
            }
            // For the inviter user lookup (second call)
            return Promise.resolve(null)
        })

        await expect(
            inviteUser(
                { email: "test@example.com" },
                utils.getMockContext("admin")
            )
        ).rejects.toThrow("User not found")
    })

    it("should throw UserAlreadyRegisteredError if the email is already registered", async () => {
        // Mock db.user.findFirst to return an existing user for the email check
        vi.spyOn(db.user, "findFirst").mockImplementation((args) => {
            if (args?.where?.email === "existing@example.com") {
                return Promise.resolve({
                    id: "existing-user-id",
                    email: "existing@example.com",
                    firstName: "Existing",
                    lastName: "User",
                    role: "USER",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    hashedPassword: "hashed-password"
                })
            }
            // For the inviter user lookup
            return Promise.resolve({
                firstName: "Admin",
                lastName: "User"
            })
        })

        await expect(
            inviteUser(
                { email: "existing@example.com" },
                utils.getMockContext("admin")
            )
        ).rejects.toThrow(UserAlreadyRegisteredError)
    })

    it("should validate the email input", async () => {
        await expect(
            inviteUser(
                { email: "invalid-email" },
                utils.getMockContext("admin")
            )
        ).rejects.toThrow()
    })

    it("should generate a token with the correct expiration from admin settings", async () => {
        // Mock getAdminSettings to return a custom expiration time
        const customExpirationHours = 48 // 2 days
        vi.mocked(db.adminSettings.findFirst).mockResolvedValueOnce({
            invitationTokenExpirationHours: customExpirationHours,
            resetPasswordTokenExpirationHours: 4
        } as any)

        await inviteUser(
            { email: "test@example.com" },
            utils.getMockContext("admin")
        )

        // Check that generateToken was called
        expect(generateToken).toHaveBeenCalled()

        // Check that hash256 was called with the token
        expect(hash256).toHaveBeenCalledWith("test-token")

        // Check that the token was created with the correct expiration
        expect(db.token.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                expiresAt: expect.any(Date)
            })
        })

        // Get the expiresAt date from the call
        const createCall = vi.mocked(db.token.create).mock.calls[0][0]
        const expiresAt = createCall.data.expiresAt as Date

        // Check that the expiration is approximately the custom hours from now
        const now = new Date()
        const expirationInMs = customExpirationHours * 60 * 60 * 1000
        const diff = expiresAt.getTime() - now.getTime()

        // Allow for a small difference due to test execution time
        expect(diff).toBeGreaterThan(expirationInMs - 1000)
        expect(diff).toBeLessThan(expirationInMs + 1000)

        // Verify that getAdminSettings was called
        expect(db.adminSettings.findFirst).toHaveBeenCalled()
    })
})
