import { baseTemplate, createButton, createParagraph } from "./templates/baseTemplate"
import { getEmailTransporter } from "@/src/lib/mailers/getEmailTransporter"
import db from "@/src/lib/db"

type InvitationMailer = {
    to: string;
    token: string;
    inviterName: string;
};

/**
 * Creates and sends an invitation email
 */
export function invitationMailer({ to, token, inviterName }: InvitationMailer) {
    // In production, set APP_ORIGIN to your production server origin
    const origin = process.env.APP_ORIGIN ?? process.env.BLITZ_DEV_SERVER_ORIGIN
    const signupUrl = `${origin}/signup?token=${token}&email=${to}`

    // Create email content
    const content = `
    ${createParagraph(`You have been invited to join Financer App by ${inviterName}.`)}
    ${createParagraph("Click the button below to create your account and get started.")}
    ${createButton({
        href: signupUrl,
        text: "Create Your Account"
    })}
    ${createParagraph("If you didn't request this invitation, you can safely ignore this email.")}
  `

    // Create the email using the base template
    const html = baseTemplate({
        title: "You're Invited to Financer App",
        previewText: `${inviterName} has invited you to join Financer App`,
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
                subject: "You're Invited to Financer App",
                html
            }

            await transporter.sendMail(msg)
        }
    }
}
