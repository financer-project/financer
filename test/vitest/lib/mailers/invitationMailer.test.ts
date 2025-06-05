import { beforeEach, describe, expect, it, vi } from "vitest"
import { invitationMailer } from "@/src/lib/mailers/invitationMailer"
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

vi.mock("nodemailer", () => ({
    default: {
        createTransport: vi.fn()
    }
}))

describe("invitationMailer", () => {
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

    it("should create a mailer with the correct parameters", () => {
        const mailer = invitationMailer({
            to: "user@example.com",
            token: "test-token",
            inviterName: "John Doe"
        })

        expect(mailer).toHaveProperty("send")
        expect(typeof mailer.send).toBe("function")
    })

    it("should send an email with the correct parameters", async () => {
        const mailer = invitationMailer({
            to: "user@example.com",
            token: "test-token",
            inviterName: "John Doe"
        })

        await mailer.send()

        // Check that getEmailTransporter was called
        expect(getEmailTransporter).toHaveBeenCalled()

        // Check that db.adminSettings.findFirst was called
        expect(db.adminSettings.findFirst).toHaveBeenCalled()

        // Check that sendMail was called with the correct parameters
        expect(mockTransporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({
            from: `"Test App" <noreply@test.com>`,
            to: "user@example.com",
            subject: "You're Invited to Financer App",
            html: expect.stringContaining("You're Invited to Financer App")
        }))
    })

    it("should include the inviter's name in the email", async () => {
        const mailer = invitationMailer({
            to: "user@example.com",
            token: "test-token",
            inviterName: "John Doe"
        })

        await mailer.send()

        // Check that the email contains the inviter's name
        expect(mockTransporter.sendMail).toHaveBeenCalledWith(
            expect.objectContaining({
                html: expect.stringContaining("John Doe")
            })
        )
    })

    it("should include the signup link in the email", async () => {
        // Set environment variables for testing
        const originalEnv = process.env
        process.env.BLITZ_DEV_SERVER_ORIGIN = "http://localhost:3000"

        const mailer = invitationMailer({
            to: "user@example.com",
            token: "test-token",
            inviterName: "John Doe"
        })

        await mailer.send()

        // Check that the email contains the signup link
        expect(mockTransporter.sendMail).toHaveBeenCalledWith(
            expect.objectContaining({
                html: expect.stringContaining("http://localhost:3000/signup?token=test-token")
            })
        )

        // Restore environment
        process.env = originalEnv
    })

    it("should throw an error if no email transporter is available", async () => {
        // Mock getEmailTransporter to return null
        vi.mocked(getEmailTransporter).mockResolvedValueOnce(null)

        const mailer = invitationMailer({
            to: "user@example.com",
            token: "test-token",
            inviterName: "John Doe"
        })

        await expect(mailer.send()).rejects.toThrow("No SMTP settings provided")
    })

    it("should use default values if admin settings are incomplete", async () => {
        // Mock admin settings with missing values
        vi.mocked(db.adminSettings.findFirst).mockResolvedValueOnce({
            smtpFromEmail: "noreply@test.com"
        } as any)

        const mailer = invitationMailer({
            to: "user@example.com",
            token: "test-token",
            inviterName: "John Doe"
        })

        await mailer.send()

        // Check that default values are used
        expect(mockTransporter.sendMail).toHaveBeenCalledWith(
            expect.objectContaining({
                from: `"Financer App" <noreply@test.com>`
            })
        )
    })
})