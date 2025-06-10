import { describe, expect, test, beforeEach } from "vitest"
import TestUtilityMock from "@/test/utility/TestUtilityMock"
import signup from "@/src/lib/model/auth/mutations/signup"
import login from "@/src/lib/model/auth/mutations/login"
import logout from "@/src/lib/model/auth/mutations/logout"
import getCurrentUser from "@/src/lib/model/auth/queries/getCurrentUser"
import { AuthenticationError } from "blitz"

describe("User Authentication", () => {
    const util = TestUtilityMock.getInstance()

    beforeEach(async () => {
        await util.seedDatabase()
    })

    describe("login", () => {
        test("authenticates user with correct credentials", async () => {
            const mockCtx = util.getMockContext("none")
            const testUser = util.getTestData().users.standard

            const result = await login({
                email: testUser.email,
                password: "password"
            }, mockCtx)

            expect(result).toBeDefined()
            expect(result.email).toBe(testUser.email)
        })

        test("fails with incorrect password", async () => {
            const mockCtx = util.getMockContext()
            const testUser = util.getTestData().users.standard

            await expect(async () => login({
                email: testUser.email,
                password: "wrongpassword"
            }, mockCtx)).rejects.toThrow(AuthenticationError)
        })

        test("fails with non-existent email", async () => {
            const mockCtx = util.getMockContext()

            await expect(async () => login({
                email: "nonexistent@example.com",
                password: "password123"
            }, mockCtx)).rejects.toThrow(AuthenticationError)
        })
    })

    describe("logout", () => {
        test("revokes the user session", async () => {
            const mockCtx = util.getMockContext("standard")

            await logout(undefined, mockCtx)
            expect(mockCtx.session.userId).toBeNull()
        })
    })

    describe("getCurrentUser", () => {
        test("returns the current user when authenticated", async () => {
            const testUser = util.getTestData().users.standard
            const mockCtx = util.getMockContext("standard")

            const currentUser = await getCurrentUser(null, mockCtx)

            expect(currentUser).toBeDefined()
            expect(currentUser?.id).toBe(testUser.id)
            expect(currentUser?.email).toBe(testUser.email)
            expect(currentUser?.firstName).toBe(testUser.firstName)
            expect(currentUser?.lastName).toBe(testUser.lastName)
        })

        test("returns null when not authenticated", async () => {
            const mockCtx = util.getMockContext("none")

            const currentUser = await getCurrentUser(null, mockCtx)
            expect(currentUser).toBeNull()
        })
    })
})
