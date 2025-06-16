import { describe, expect, test } from "vitest"
import TestUtilityMock from "@/test/utility/TestUtilityMock"
import getTags from "@/src/lib/model/tags/queries/getTags"
import createTag from "@/src/lib/model/tags/mutations/createTag"
import getTag from "@/src/lib/model/tags/queries/getTag"
import updateTag from "@/src/lib/model/tags/mutations/updateTag"
import deleteTag from "@/src/lib/model/tags/mutations/deleteTag"
import ColorType from "@/src/lib/model/common/ColorType"

describe("Tag Mutations & Queries", () => {
    const util = TestUtilityMock.getInstance()

    beforeEach(async () => {
        await util.seedDatabase()
    })

    describe("get", () => {
        test("get all tags for a household", async () => {
            const result = await getTags({ householdId: util.getTestData().households.standard.id }, util.getMockContext())
            expect(result.tags).toHaveLength(2)
        })

        test("get specific tag by ID", async () => {
            const tag = await getTag({ id: util.getTestData().tags.standard.work.id }, util.getMockContext())
            expect(tag.id).toBe(util.getTestData().tags.standard.work.id)
        })
    })

    describe("create", () => {
        test("creates a new tag successfully", async () => {
            const result = await createTag({
                name: "Test Tag",
                householdId: util.getTestData().households.standard.id,
                description: "Test Description",
                color: ColorType.INDIGO
            }, util.getMockContext())

            expect(result.id).not.toBeUndefined()
            expect(result.name).toBe("Test Tag")
            expect(result.description).toBe("Test Description")
            expect(result.color).toBe(ColorType.INDIGO)
        })

        test("creates a new tag with minimal data", async () => {
            const result = await createTag({
                name: "Minimal Tag",
                householdId: util.getTestData().households.standard.id,
                description: null,
                color: null
            }, util.getMockContext())

            expect(result.id).not.toBeUndefined()
            expect(result.name).toBe("Minimal Tag")
            expect(result.description).toBeNull()
            expect(result.color).toBeNull()
        })

        test("fails to create a tag with invalid data", async () => {
            await expect(async () => createTag({
                name: "ab", // Too short (min 3 chars)
                householdId: util.getTestData().households.standard.id,
                description: null,
                color: null
            }, util.getMockContext())).rejects.toThrowError()
        })
    })

    describe("update", () => {
        test("updates a tag successfully", async () => {
            const result = await updateTag({
                id: util.getTestData().tags.standard.work.id,
                householdId: util.getTestData().households.standard.id,
                name: "Updated Tag Name",
                description: "Updated Description",
                color: ColorType.GREEN
            }, util.getMockContext())

            expect(result.name).toBe("Updated Tag Name")
            expect(result.description).toBe("Updated Description")
            expect(result.color).toBe(ColorType.GREEN)
        })

        test("fails to update non-existing tag", async () => {
            await expect(async () => updateTag({
                id: "non-existent-id",
                householdId: util.getTestData().households.standard.id,
                name: "Invalid Update",
                description: null,
                color: null
            }, util.getMockContext())).rejects.toThrowError()
        })
    })

    describe("delete", () => {
        test("deletes a tag successfully", async () => {
            await deleteTag({ id: util.getTestData().tags.standard.work.id }, util.getMockContext())
            await expect(async () => getTag({ id: util.getTestData().tags.standard.work.id }, util.getMockContext()))
                .rejects.toThrowError()
        })

        test("fails to delete non-existing tag", async () => {
            await expect(async () => deleteTag({ id: "non-existent-id" }, util.getMockContext()))
                .rejects.toThrowError()
        })
    })
})