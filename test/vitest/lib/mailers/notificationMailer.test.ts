import { beforeEach, describe, expect, it, vi } from "vitest"
import { notificationMailer } from "@/src/lib/mailers/notificationMailer"
import { getEmailTransporter } from "@/src/lib/mailers/getEmailTransporter"
import db from "@/src/lib/db"

// Mock dependencies
vi.mock("@/src/lib/mailers/getEmailTransporter", () => ({
    getEmailTransporter: vi.fn()
}))

vi.mock("@/src/lib/db", () => ({
    default: {
        adminSettings: {
            findFirst: vi.fn()
        }
    }
}))

describe("notificationMailer", () => {
    const mockTransporter = {
        sendMail: vi.fn().mockResolvedValue({ messageId: "test-message-id" })
    }

    const mockAdminSettings = {
        smtpHost: "smtp.test.com",
        smtpPort: 587,
        smtpUser: "test@test.com",
        smtpPassword: "password",
        smtpFromEmail: "noreply@test.com",
        smtpFromName: "Test App"
    }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(getEmailTransporter).mockResolvedValue(mockTransporter as any)
        vi.mocked(db.adminSettings.findFirst).mockResolvedValue(mockAdminSettings as any)
    })

    it("should send a simple notification email", async () => {
        const mailer = notificationMailer({
            to: "user@example.com",
            title: "Test Notification",
            message: "This is a test notification."
        })

        await mailer.send()

        expect(getEmailTransporter).toHaveBeenCalled()
        expect(db.adminSettings.findFirst).toHaveBeenCalled()
        expect(mockTransporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({
            from: `"Test App" <noreply@test.com>`,
            to: "user@example.com",
            subject: "Test Notification",
            html: expect.stringContaining("This is a test notification.")
        }))
    })

    it("should include a link when provided", async () => {
        const mailer = notificationMailer({
            to: "user@example.com",
            title: "With Link",
            message: "Please click the button below.",
            link: { href: "http://example.com", text: "Open" }
        })

        await mailer.send()

        expect(mockTransporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({
            html: expect.stringContaining("http://example.com")
        }))
    })

    it("should throw when transporter is missing", async () => {
        vi.mocked(getEmailTransporter).mockResolvedValueOnce(null as any)
        const mailer = notificationMailer({ to: "user@example.com", title: "X", message: "Y" })
        await expect(mailer.send()).rejects.toThrow("No SMTP settings provided")
    })
})
