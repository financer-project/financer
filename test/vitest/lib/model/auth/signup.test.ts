import { beforeEach, describe, expect, it, test, vi } from "vitest"
import db from "@/src/lib/db"
import signup from "@/src/lib/model/auth/mutations/signup"
import TestUtilityMock from "@/test/utility/TestUtilityMock"
import getAdminSettings from "@/src/lib/model/settings/queries/getAdminSettings"
import { hash256 } from "@blitzjs/auth"
import { SecurePassword } from "@blitzjs/auth/secure-password"

// Mock dependencies
vi.mock("@/src/lib/model/settings/queries/getAdminSettings", () => ({
    default: vi.fn().mockResolvedValue({
        allowRegistration: true
    })
}))

vi.mock("@blitzjs/auth", async () => {
    const actual = await vi.importActual("@blitzjs/auth")
    return {
        ...actual,
        hash256: vi.fn().mockReturnValue("hashed-test-token")
    }
})

vi.mock("@blitzjs/auth/secure-password", () => ({
    SecurePassword: {
        hash: vi.fn().mockResolvedValue("hashed-password")
    }
}))

describe("Signup Mutation", () => {
    const utils = TestUtilityMock.getInstance()

    beforeEach(async () => {
        await utils.seedDatabase()
        vi.clearAllMocks()

        // Mock db.token.findFirst and db.token.delete
        vi.spyOn(db.token, "findFirst").mockResolvedValue(null)
        vi.spyOn(db.token, "delete").mockResolvedValue({
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

    describe("General Use Cases", () => {
        test("creates a new user and establishes a session", async () => {
            const mockCtx = utils.getMockContext("none")

            const result = await signup({
                firstName: "Test",
                lastName: "User",
                email: "test.user@example.com",
                password: "Password123!"
            }, mockCtx)

            expect(result).toBeDefined()
            expect(result.firstName).toBe("Test")
            expect(result.lastName).toBe("User")
            expect(result.email).toBe("test.user@example.com")
        })

        test("fails when email already exists", async () => {
            const existingUser = utils.getTestData().users.standard
            const mockCtx = utils.getMockContext()

            await expect(async () => signup({
                firstName: "Test",
                lastName: "User",
                email: existingUser.email,
                password: "Password123!"
            }, mockCtx)).rejects.toThrow()
        })

        it("should successfully sign up a user when registration is allowed", async () => {
            // Mock getAdminSettings to return allowRegistration: true
            vi.mocked(getAdminSettings).mockResolvedValueOnce({
                allowRegistration: true
            } as any)

            const result = await signup(
                {
                    firstName: "Test",
                    lastName: "User",
                    email: "test@example.com",
                    password: "password123"
                },
                utils.getMockContext("none")
            )

            // Check that the user was created
            expect(db.user.create).toHaveBeenCalledWith({
                data: {
                    firstName: "Test",
                    lastName: "User",
                    email: "test@example.com",
                    hashedPassword: "hashed-password"
                }
            })

            // Check that the password was hashed
            expect(SecurePassword.hash).toHaveBeenCalledWith("password123")

            // Check that the result contains the user data
            expect(result).toMatchObject({
                firstName: "Test",
                lastName: "User",
                email: "test@example.com"
            })
        })
    })

    describe("Token based signup", () => {

        it("should successfully sign up a user with a valid invitation token", async () => {
            // Mock getAdminSettings to return allowRegistration: false
            vi.mocked(db.adminSettings.findFirst).mockResolvedValueOnce({
                allowRegistration: true
            } as any)

            // Mock db.token.findFirst to return a valid token
            vi.mocked(db.token.findFirst).mockResolvedValueOnce({
                id: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
                hashedToken: "hashed-test-token",
                type: "INVITATION",
                expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000), // 3 days from now
                sentTo: "test@example.com",
                userId: utils.getTestData().users.admin.id
            } as any)

            const result = await signup(
                {
                    firstName: "Test",
                    lastName: "User",
                    email: "test@example.com",
                    password: "password123",
                    token: "test-token"
                },
                utils.getMockContext("none")
            )

            // Check that the token was hashed and looked up
            expect(hash256).toHaveBeenCalledWith("test-token")
            expect(db.token.findFirst).toHaveBeenCalledWith({
                where: {
                    hashedToken: "hashed-test-token",
                    type: { in: ["INVITATION", "INVITATION_HOUSEHOLD"] },
                    sentTo: "test@example.com",
                    expiresAt: { gt: expect.any(Date) }
                }
            })

            // Check that the token was deleted
            expect(db.token.delete).toHaveBeenCalledWith({
                where: { id: 1 }
            })

            // Check that the user was created
            expect(db.user.create).toHaveBeenCalledWith({
                data: {
                    firstName: "Test",
                    lastName: "User",
                    email: "test@example.com",
                    hashedPassword: "hashed-password"
                }
            })

            // Check that the result contains the user data
            expect(result).toMatchObject({
                firstName: "Test",
                lastName: "User",
                email: "test@example.com"
            })
        })

        it("should throw an error when registration is not allowed and no token is provided", async () => {
            // Mock getAdminSettings to return allowRegistration: false
            vi.mocked(db.adminSettings.findFirst).mockResolvedValueOnce({
                allowRegistration: false
            } as any)

            await expect(
                signup({
                        firstName: "Test",
                        lastName: "User",
                        email: "test@example.com",
                        password: "password123"
                    },
                    utils.getMockContext("none"))
            ).rejects.toThrow("Registration is currently by invitation only. Please use an invitation link.")
        })

        it("should throw an error when the invitation token is invalid", async () => {
            // Mock getAdminSettings to return allowRegistration: false
            vi.mocked(getAdminSettings).mockResolvedValueOnce({
                allowRegistration: false
            } as any)

            // Mock db.token.findFirst to return null (no valid token)
            vi.mocked(db.token.findFirst).mockResolvedValueOnce(null)

            await expect(
                signup(
                    {
                        firstName: "Test",
                        lastName: "User",
                        email: "test@example.com",
                        password: "password123",
                        token: "invalid-token"
                    },
                    utils.getMockContext("none")
                )
            ).rejects.toThrow("Invalid or expired invitation token.")
        })

        it("should throw an error when the invitation token is expired", async () => {
            // Mock getAdminSettings to return allowRegistration: false
            vi.mocked(getAdminSettings).mockResolvedValueOnce({
                allowRegistration: false
            } as any)

            // Mock db.token.findFirst to return null (simulating expired token)
            vi.mocked(db.token.findFirst).mockResolvedValueOnce(null)

            await expect(
                signup(
                    {
                        firstName: "Test",
                        lastName: "User",
                        email: "test@example.com",
                        password: "password123",
                        token: "expired-token"
                    },
                    utils.getMockContext("none")
                )
            ).rejects.toThrow("Invalid or expired invitation token.")
        })
    })
})