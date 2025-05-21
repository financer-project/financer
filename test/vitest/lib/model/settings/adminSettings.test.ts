import { beforeEach, describe, expect, it, vi } from "vitest"
import db from "@/src/lib/db"
import updateAdminSettings from "@/src/lib/model/settings/mutations/updateAdminSettings"
import getAdminSettings from "@/src/lib/model/settings/queries/getAdminSettings"
import sendTestEmail from "@/src/lib/model/settings/mutations/sendTestEmail"
import TestUtilityMock from "@/test/utility/TestUtilityMock"
import nodemailer from "nodemailer"

// Mock nodemailer
vi.mock("nodemailer", () => ({
    default: {
        createTransport: vi.fn().mockReturnValue({
            sendMail: vi.fn().mockResolvedValue({ messageId: "test-message-id" })
        })
    }
}))

describe("Admin Settings", () => {
    const utils = TestUtilityMock.getInstance()

    beforeEach(async () => {
        await utils.seedDatabase()
        vi.clearAllMocks()
    })

    describe("getAdminSettings", () => {
        it("should return default settings when none exist", async () => {
            // Delete any existing admin settings
            await db.adminSettings.deleteMany()

            const settings = await getAdminSettings(null, utils.getMockContext("admin"))

            // Assert default values
            expect(settings).toMatchObject({
                smtpHost: null,
                smtpPort: null,
                smtpUser: null,
                smtpPassword: null,
                smtpFromEmail: null,
                smtpFromName: "Financer App",
                smtpEncryption: null,
                allowRegistration: true,
                defaultLanguage: "en-US",
                defaultTheme: "light"
            })
        })

        it("should return existing settings", async () => {
            // Create admin settings
            await db.adminSettings.upsert({
                where: { id: 1 },
                update: {
                    smtpHost: "smtp.test.com",
                    smtpPort: 587,
                    smtpUser: "test@test.com",
                    smtpPassword: "password",
                    smtpFromEmail: "noreply@test.com",
                    smtpFromName: "Test App",
                    smtpEncryption: "tls",
                    allowRegistration: false,
                    defaultLanguage: "de-DE",
                    defaultTheme: "dark"
                },
                create: {
                    id: 1,
                    smtpHost: "smtp.test.com",
                    smtpPort: 587,
                    smtpUser: "test@test.com",
                    smtpPassword: "password",
                    smtpFromEmail: "noreply@test.com",
                    smtpFromName: "Test App",
                    smtpEncryption: "tls",
                    allowRegistration: false,
                    defaultLanguage: "de-DE",
                    defaultTheme: "dark"
                }
            })

            const settings = await getAdminSettings(null, utils.getMockContext("admin"))

            expect(settings).toMatchObject({
                smtpHost: "smtp.test.com",
                smtpPort: 587,
                smtpUser: "test@test.com",
                smtpPassword: "password",
                smtpFromEmail: "noreply@test.com",
                smtpFromName: "Test App",
                smtpEncryption: "tls",
                allowRegistration: false,
                defaultLanguage: "de-DE",
                defaultTheme: "dark"
            })
        })

        it("should throw an error if not authorized", async () => {
            await expect(async () =>
                getAdminSettings(null, utils.getMockContext("standard"))
            ).rejects.toThrow()
        })
    })

    describe("updateAdminSettings", () => {
        it("should update admin settings", async () => {
            const updatedSettings = await updateAdminSettings({
                smtpHost: "smtp.updated.com",
                smtpPort: 465,
                smtpUser: "updated@test.com",
                smtpPassword: "newpassword",
                smtpFromEmail: "noreply@updated.com",
                smtpFromName: "Updated App",
                smtpEncryption: "ssl",
                allowRegistration: true,
                defaultLanguage: "en-US",
                defaultTheme: "light"
            }, utils.getMockContext("admin"))

            expect(updatedSettings).toMatchObject({
                smtpHost: "smtp.updated.com",
                smtpPort: 465,
                smtpUser: "updated@test.com",
                smtpPassword: "newpassword",
                smtpFromEmail: "noreply@updated.com",
                smtpFromName: "Updated App",
                smtpEncryption: "ssl",
                allowRegistration: true,
                defaultLanguage: "en-US",
                defaultTheme: "light"
            })

            const savedSettings = await db.adminSettings.findFirst()

            expect(savedSettings).toMatchObject({
                smtpHost: "smtp.updated.com",
                smtpPort: 465,
                smtpUser: "updated@test.com",
                smtpPassword: "newpassword",
                smtpFromEmail: "noreply@updated.com",
                smtpFromName: "Updated App",
                smtpEncryption: "ssl",
                allowRegistration: true,
                defaultLanguage: "en-US",
                defaultTheme: "light"
            })
        })

        it("should throw an error if not authorized", async () => {
            await expect(async () =>
                updateAdminSettings({
                    smtpHost: "smtp.test.com",
                    smtpPort: 587,
                    smtpUser: "test@test.com",
                    smtpPassword: "password",
                    smtpFromEmail: "noreply@test.com",
                    smtpFromName: "Test App",
                    smtpEncryption: "tls",
                    allowRegistration: false,
                    defaultLanguage: "de-DE",
                    defaultTheme: "dark"
                }, utils.getMockContext("standard"))
            ).rejects.toThrow()
        })
    })

    describe("sendTestEmail", () => {
        it("should send a test email", async () => {
            const result = await sendTestEmail({
                smtpHost: "smtp.test.com",
                smtpPort: 587,
                smtpUser: "test@test.com",
                smtpPassword: "password",
                smtpFromEmail: "noreply@test.com",
                smtpFromName: "Test App",
                smtpEncryption: "tls",
                testEmailRecipient: "recipient@test.com"
            }, utils.getMockContext("admin"))

            expect(result).toEqual({ success: true })
            expect(nodemailer.createTransport).toHaveBeenCalledWith(expect.objectContaining({
                host: "smtp.test.com",
                port: 587,
                auth: {
                    user: "test@test.com",
                    pass: "password"
                },
                tls: expect.any(Object),
                requireTLS: true
            }))

            const transporter = nodemailer.createTransport()
            expect(transporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({
                from: "\"Test App\" <noreply@test.com>",
                to: "recipient@test.com",
                subject: "Test Email from Financer App"
            }))
        })

        it("should use session email if no recipient provided", async () => {
            const result = await sendTestEmail({
                smtpHost: "smtp.test.com",
                smtpPort: 587,
                smtpUser: "test@test.com",
                smtpPassword: "password",
                smtpFromEmail: "noreply@test.com",
                smtpFromName: "Test App",
                smtpEncryption: null,
                testEmailRecipient: null
            }, utils.getMockContext("admin"))

            expect(result).toEqual({ success: true })

            const transporter = nodemailer.createTransport()
            expect(transporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({
                to: "admin@financer.com" // This is the email from the mock context
            }))
        })

        it("should throw an error if not authorized", async () => {
            await expect(async () =>
                sendTestEmail({
                    smtpHost: "smtp.test.com",
                    smtpPort: 587,
                    smtpUser: "test@test.com",
                    smtpPassword: "password",
                    smtpFromEmail: "noreply@test.com",
                    smtpFromName: "Test App",
                    smtpEncryption: "tls",
                    testEmailRecipient: null
                }, utils.getMockContext("standard"))
            ).rejects.toThrow()
        })
    })
})
