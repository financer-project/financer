import { AuthenticatedCtx } from "blitz"
import { Role } from "@prisma/client"
import { resolver } from "@blitzjs/rpc"
import { z } from "zod"
import { getEmailTransporter } from "@/src/lib/mailers/getEmailTransporter"
import nodemailer from "nodemailer"

// Define a schema for the test email input
const SendTestEmailSchema = z.object({
    smtpHost: z.string(),
    smtpPort: z.number(),
    smtpUser: z.string(),
    smtpPassword: z.string(),
    smtpFromEmail: z.string().email(),
    smtpFromName: z.string(),
    smtpEncryption: z.string().nullable(),
    testEmailRecipient: z.string().email().nullable()
})

export default resolver.pipe(
    resolver.zod(SendTestEmailSchema),
    resolver.authorize(Role.ADMIN),
    async function sendTestEmail(data, ctx: AuthenticatedCtx) {
        // Create a transporter with the provided SMTP settings
        const transporter = await getEmailTransporter()
        if (transporter) {
            const transporter = await nodemailer.createTransport({
                host: data.smtpHost,
                port: data.smtpPort,
                secure: data.smtpPort === 465, // true for 465, false for other ports
                auth: {
                    user: data.smtpUser,
                    pass: data.smtpPassword
                },
                // Set encryption type based on the provided value
                ...(data.smtpEncryption !== "none" && {
                    tls: {
                        ciphers: data.smtpEncryption === "starttls" ? "SSLv3" : undefined
                    },
                    requireTLS: data.smtpEncryption === "tls" || data.smtpEncryption === "starttls"
                })
            })
            await transporter.sendMail({
                from: `"${data.smtpFromName}" <${data.smtpFromEmail}>`,
                to: data.testEmailRecipient ?? ctx.session.email ?? data.smtpFromEmail,
                subject: "Test Email from Financer App",
                text: "This is a test email from your Financer App. If you received this, your email settings are working correctly!",
                html: "<p>This is a test email from your Financer App. If you received this, your email settings are working correctly!</p>"
            })

            return { success: true }
        } else {
            throw new Error("Email Transporter not defined. Configure the email settings first.")
        }
    }
)
