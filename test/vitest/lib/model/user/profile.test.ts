import { describe, expect, test, vi, beforeEach } from "vitest"
import getProfile from "@/src/lib/model/user/queries/getProfile"
import updateProfile from "@/src/lib/model/user/mutations/updateProfile"
import deleteAvatar from "@/src/lib/model/user/mutations/deleteAvatar"
import TestUtilityMock from "@/test/utility/TestUtilityMock"
import { deleteUserAvatar } from "@/src/lib/util/fileStorage"
import db from "@/src/lib/db"

// Mock fileStorage
vi.mock("@/src/lib/util/fileStorage", () => ({
    deleteUserAvatar: vi.fn(),
    saveUserAvatar: vi.fn(),
    ensureDirectoryExists: vi.fn(),
    deleteFile: vi.fn()
}))

describe("User Profile", () => {
    const util = TestUtilityMock.getInstance()

    beforeEach(async () => {
        await util.seedDatabase()
        vi.clearAllMocks()
    })

    describe("getProfile", () => {
        test("returns profile data for authenticated user", async () => {
            const testUser = util.getTestData().users.standard
            const mockCtx = util.getMockContext("standard")

            const profile = await getProfile(null, mockCtx)

            expect(profile).toBeDefined()
            expect(profile.id).toBe(testUser.id)
            expect(profile.firstName).toBe(testUser.firstName)
            expect(profile.lastName).toBe(testUser.lastName)
            expect(profile.email).toBe(testUser.email)
            expect(profile.hasAvatar).toBe(false)
            expect(profile.hasPassword).toBe(true)
        })

        test("returns hasAvatar true when user has avatar", async () => {
            const testUser = util.getTestData().users.standard
            const mockCtx = util.getMockContext("standard")

            // Set avatar path for the user
            await db.user.update({
                where: { id: testUser.id },
                data: { avatarPath: "data/users/test/avatar/avatar.jpg" }
            })

            const profile = await getProfile(null, mockCtx)

            expect(profile.hasAvatar).toBe(true)
        })

        test("throws error when user is not authenticated", async () => {
            const mockCtx = util.getMockContext("none")

            await expect(async () => {
                await getProfile(null, mockCtx)
            }).rejects.toThrow()
        })

        test("throws NotFoundError when user does not exist", async () => {
            const mockCtx = util.getMockContext("standard")

            // Delete the user from database
            await db.user.delete({
                where: { id: util.getTestData().users.standard.id }
            })

            await expect(async () => {
                await getProfile(null, mockCtx)
            }).rejects.toThrow()
        })
    })

    describe("updateProfile", () => {
        test("updates user profile successfully", async () => {
            const testUser = util.getTestData().users.standard
            const mockCtx = util.getMockContext("standard")

            const result = await updateProfile({
                firstName: "NewFirst",
                lastName: "NewLast",
                email: testUser.email
            }, mockCtx)

            expect(result.firstName).toBe("NewFirst")
            expect(result.lastName).toBe("NewLast")

            // Verify in database
            const updatedUser = await db.user.findUnique({
                where: { id: testUser.id }
            })
            expect(updatedUser?.firstName).toBe("NewFirst")
            expect(updatedUser?.lastName).toBe("NewLast")
        })

        test("updates email successfully", async () => {
            const testUser = util.getTestData().users.standard
            const mockCtx = util.getMockContext("standard")

            const result = await updateProfile({
                firstName: testUser.firstName,
                lastName: testUser.lastName,
                email: "newemail@example.com"
            }, mockCtx)

            expect(result.email).toBe("newemail@example.com")
        })

        test("throws error when email is already in use by another user", async () => {
            const adminUser = util.getTestData().users.admin
            const mockCtx = util.getMockContext("standard")

            await expect(async () => {
                await updateProfile({
                    firstName: "Test",
                    lastName: "User",
                    email: adminUser.email // Use admin's email
                }, mockCtx)
            }).rejects.toThrow("Email is already in use")
        })

        test("allows keeping the same email", async () => {
            const testUser = util.getTestData().users.standard
            const mockCtx = util.getMockContext("standard")

            // Should not throw even though email already exists (it's the user's own email)
            const result = await updateProfile({
                firstName: "Updated",
                lastName: "Name",
                email: testUser.email
            }, mockCtx)

            expect(result.email).toBe(testUser.email)
        })

        test("throws error when user is not authenticated", async () => {
            const mockCtx = util.getMockContext("none")

            await expect(async () => {
                await updateProfile({
                    firstName: "Test",
                    lastName: "User",
                    email: "test@example.com"
                }, mockCtx)
            }).rejects.toThrow()
        })

        test("validates firstName is required", async () => {
            const mockCtx = util.getMockContext("standard")

            await expect(async () => {
                await updateProfile({
                    firstName: "",
                    lastName: "User",
                    email: "test@example.com"
                }, mockCtx)
            }).rejects.toThrow()
        })

        test("validates lastName is required", async () => {
            const mockCtx = util.getMockContext("standard")

            await expect(async () => {
                await updateProfile({
                    firstName: "Test",
                    lastName: "",
                    email: "test@example.com"
                }, mockCtx)
            }).rejects.toThrow()
        })

        test("validates email format", async () => {
            const mockCtx = util.getMockContext("standard")

            await expect(async () => {
                await updateProfile({
                    firstName: "Test",
                    lastName: "User",
                    email: "invalid-email"
                }, mockCtx)
            }).rejects.toThrow()
        })

        test("normalizes email to lowercase", async () => {
            const mockCtx = util.getMockContext("standard")

            const result = await updateProfile({
                firstName: "Test",
                lastName: "User",
                email: "TEST@EXAMPLE.COM"
            }, mockCtx)

            expect(result.email).toBe("test@example.com")
        })
    })

    describe("deleteAvatar", () => {
        test("deletes avatar successfully when user has one", async () => {
            const testUser = util.getTestData().users.standard
            const mockCtx = util.getMockContext("standard")
            const avatarPath = "data/users/test/avatar/avatar.jpg"

            // Set avatar path for the user
            await db.user.update({
                where: { id: testUser.id },
                data: { avatarPath }
            })

            const result = await deleteAvatar(null, mockCtx)

            expect(result.success).toBe(true)
            expect(deleteUserAvatar).toHaveBeenCalledWith(avatarPath)

            // Verify in database
            const updatedUser = await db.user.findUnique({
                where: { id: testUser.id }
            })
            expect(updatedUser?.avatarPath).toBeNull()
        })

        test("succeeds even when user has no avatar", async () => {
            const mockCtx = util.getMockContext("standard")

            const result = await deleteAvatar(null, mockCtx)

            expect(result.success).toBe(true)
            expect(deleteUserAvatar).not.toHaveBeenCalled()
        })

        test("throws error when user is not authenticated", async () => {
            const mockCtx = util.getMockContext("none")

            await expect(async () => {
                await deleteAvatar(null, mockCtx)
            }).rejects.toThrow()
        })
    })
})
