import { beforeEach, describe, expect, it, vi } from "vitest"
import { forgotPasswordMailer } from "@/src/lib/mailers/forgotPasswordMailer"
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

describe("forgotPasswordMailer", () => {
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
        const mailer = forgotPasswordMailer({
            to: "user@example.com",
            token: "test-token"
        })

        expect(mailer).toHaveProperty("send")
        expect(typeof mailer.send).toBe("function")
    })

    it("should send an email with the correct parameters", async () => {
        const mailer = forgotPasswordMailer({
            to: "user@example.com",
            token: "test-token"
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
            subject: "Reset Your Password - Financer App",
            html: expect.stringContaining("Reset Your Password")
        }))
    })

    it("should include the reset link in the email", async () => {
        // Set environment variables for testing
        const originalEnv = process.env
        process.env.BLITZ_DEV_SERVER_ORIGIN = "http://localhost:3000"

        const mailer = forgotPasswordMailer({
            to: "user@example.com",
            token: "test-token"
        })

        await mailer.send()

        // Check that the email contains the reset link
        expect(mockTransporter.sendMail).toHaveBeenCalledWith(
            expect.objectContaining({
                html: expect.stringContaining("http://localhost:3000/reset-password?token=test-token")
            })
        )

        // Restore environment
        process.env = originalEnv
    })

    it("should throw an error if no email transporter is available", async () => {
        // Mock getEmailTransporter to return null
        vi.mocked(getEmailTransporter).mockResolvedValueOnce(null)

        const mailer = forgotPasswordMailer({
            to: "user@example.com",
            token: "test-token"
        })

        await expect(mailer.send()).rejects.toThrow("No SMTP settings provided")
    })

    it("should use default values if admin settings are incomplete", async () => {
        // Mock admin settings with missing values
        vi.mocked(db.adminSettings.findFirst).mockResolvedValueOnce({
            smtpFromEmail: "noreply@test.com"
        } as any)

        const mailer = forgotPasswordMailer({
            to: "user@example.com",
            token: "test-token"
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