import { baseTemplate, createButton, createParagraph } from "./templates/baseTemplate"
import { getEmailTransporter } from "@/src/lib/mailers/getEmailTransporter"
import db from "@/src/lib/db"

export type NotificationLink = {
    href: string;
    text: string;
}

type NotificationMailer = {
    to: string;
    title: string;
    message: string;
    link?: NotificationLink;
}

/**
 * Creates and sends a general purpose notification email
 */
export function notificationMailer({ to, title, message, link }: NotificationMailer) {
    const content = `
    ${createParagraph(message)}
    ${link ? createButton({ href: link.href, text: link.text }) : ""}
  `

    const html = baseTemplate({
        title,
        previewText: title,
        content
    })

    return {
        async send() {
            const transporter = await getEmailTransporter()
            if (!transporter) {
                throw new Error("No SMTP settings provided")
            }

            const adminSettings = await db.adminSettings.findFirst()

            const msg = {
                from: `"${adminSettings?.smtpFromName ?? "Financer App"}" <${adminSettings?.smtpFromEmail}>`,
                to,
                subject: title,
                html
            }

            await transporter.sendMail(msg)
        }
    }
}
