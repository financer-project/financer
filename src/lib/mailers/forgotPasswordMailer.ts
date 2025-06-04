import { baseTemplate, createButton, createParagraph } from "./templates/baseTemplate"
import { getEmailTransporter } from "@/src/lib/mailers/getEmailTransporter"
import db from "@/src/lib/db"

type ResetPasswordMailer = {
    to: string;
    token: string;
}

/**
 * Creates and sends a password reset email
 */
export function forgotPasswordMailer({ to, token }: ResetPasswordMailer) {
    // In production, set APP_ORIGIN to your production server origin
    const origin = process.env.APP_ORIGIN ?? process.env.BLITZ_DEV_SERVER_ORIGIN
    const resetUrl = `${origin}/reset-password?token=${token}`

    // Create email content
    const content = `
    ${createParagraph("You recently requested to reset your password for your Financer App account.")}
    ${createParagraph("Click the button below to reset your password. This link will expire in 4 hours.")}
    ${createButton({
        href: resetUrl,
        text: "Reset Your Password"
    })}
    ${createParagraph("If you didn't request a password reset, you can safely ignore this email.")}
  `

    // Create the email using the base template
    const html = baseTemplate({
        title: "Reset Your Password",
        previewText: "Reset your Financer App password",
        content
    })

    return {
        async send() {
            const transporter = await getEmailTransporter()
            if (!transporter) {
                throw new Error("No SMTP settings provided")
            }

            // Get admin settings for the from field
            const adminSettings = await db.adminSettings.findFirst()

            // Create the email message
            const msg = {
                from: `"${adminSettings?.smtpFromName ?? "Financer App"}" <${adminSettings?.smtpFromEmail}>`,
                to,
                subject: "Reset Your Password - Financer App",
                html
            }

            await transporter.sendMail(msg)
        }
    }
}
