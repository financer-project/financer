import { describe, expect, it } from "vitest"
import db from "@/src/lib/db"
import updateSetting from "@/src/lib/model/settings/mutations/updateSetting"
import getSetting from "@/src/lib/model/settings/queries/getSetting"
import TestUtilityFactory from "@/test/utility/TestUtilityFactory"

describe("User Settings", () => {
    const utils = TestUtilityFactory.mock()

    beforeEach(async () => {
        await utils.seedDatabase()
    })


    describe("getSetting", () => {
        it("should return default settings when none exist", async () => {
            const settings = await getSetting(null, utils.getMockContext("standard"))

            // Assert default values
            expect(settings).toMatchObject({
                userId: utils.getTestData().users.standard.id,
                language: "en-US",
                theme: "light"
            })
        })

        it("should return existing settings", async () => {
            const settings = await getSetting(null, utils.getMockContext("standard"))

            expect(settings).toMatchObject({
                userId: utils.getTestData().users.standard.id,
                language: "en-US",
                theme: "light"
            })
        })
    })

    describe("updateSetting", () => {
        it("should update user settings", async () => {
            const updatedSettings = await updateSetting({
                userId: utils.getTestData().users.standard.id,
                language: "de-DE",
                theme: "dark"
            }, utils.getMockContext("standard"))

            expect(updatedSettings).toMatchObject({
                userId: utils.getTestData().users.standard.id,
                language: "de-DE",
                theme: "dark"
            })

            const savedSettings = await db.settings.findFirst({
                where: { userId: utils.getTestData().users.standard.id }
            })

            expect(savedSettings).toMatchObject({
                userId: utils.getTestData().users.standard.id,
                language: "de-DE",
                theme: "dark"
            })
        })

        it("should throw an error if not authorized", async () => {
            await expect(async () => updateSetting({
                    userId: utils.getTestData().users.admin.id,
                    language: "fr-FR",
                    theme: "dark"
                }, utils.getMockContext("standard"))
            ).rejects.toThrow()
        })
    })
})