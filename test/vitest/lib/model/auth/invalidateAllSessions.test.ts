import { beforeEach, describe, expect, it, vi } from "vitest"
import db from "@/src/lib/db"
import invalidateAllSessions from "@/src/lib/model/auth/mutations/invalidateAllSessions"
import TestUtilityMock from "@/test/utility/TestUtilityMock"

describe("invalidateAllSessions mutation", () => {
    const utils = TestUtilityMock.getInstance()

    beforeEach(async () => {
        await utils.seedDatabase()
        vi.clearAllMocks()
    })

    it("should delete all sessions except the current one", async () => {
        const testUser = utils.getTestData().users.standard
        const mockCtx = utils.getMockContext("standard")
        const currentHandle = mockCtx.session.$handle

        vi.spyOn(db.session, "deleteMany").mockResolvedValue({ count: 3 })

        const result = await invalidateAllSessions(undefined, mockCtx)

        expect(result).toBe(true)
        expect(db.session.deleteMany).toHaveBeenCalledWith({
            where: {
                userId: testUser.id,
                handle: { not: currentHandle }
            }
        })
    })

    it("should return true even when no other sessions exist", async () => {
        const mockCtx = utils.getMockContext("standard")

        vi.spyOn(db.session, "deleteMany").mockResolvedValue({ count: 0 })

        const result = await invalidateAllSessions(undefined, mockCtx)

        expect(result).toBe(true)
        expect(db.session.deleteMany).toHaveBeenCalled()
    })

    it("should throw error when user is not authenticated", async () => {
        const mockCtx = utils.getMockContext("none")

        await expect(async () => {
            await invalidateAllSessions(undefined, mockCtx)
        }).rejects.toThrow()
    })

    it("should only delete sessions for the current user", async () => {
        const testUser = utils.getTestData().users.standard
        const mockCtx = utils.getMockContext("standard")

        vi.spyOn(db.session, "deleteMany").mockResolvedValue({ count: 2 })

        await invalidateAllSessions(undefined, mockCtx)

        const deleteCall = vi.mocked(db.session.deleteMany).mock.calls[0][0]
        expect(deleteCall?.where?.userId).toBe(testUser.id)
    })
})
