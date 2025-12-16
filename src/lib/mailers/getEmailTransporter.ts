import nodemailer, { Transporter } from "nodemailer"
import db from "@/src/lib/db"
import SMTPTransport from "nodemailer/lib/smtp-transport"

export const getEmailTransporter = async (): Promise<Transporter<SMTPTransport.SentMessageInfo, SMTPTransport.Options> | null> => {
    const adminSettings = await db.adminSettings.findFirst()

    if (adminSettings?.smtpHost && adminSettings?.smtpUser && adminSettings?.smtpPassword) {
        return nodemailer.createTransport({
            host: adminSettings.smtpHost,
            port: adminSettings.smtpPort ?? 587,
            secure: (adminSettings.smtpPort ?? 587) === 465, // true for 465, false for other ports
            auth: {
                user: adminSettings.smtpUser ?? "",
                pass: adminSettings.smtpPassword ?? ""
            },
            ...(adminSettings.smtpEncryption !== "none" && {
                tls: {
                    ciphers: adminSettings.smtpEncryption === "starttls" ? "SSLv3" : undefined
                },
                requireTLS: adminSettings.smtpEncryption === "tls" || adminSettings.smtpEncryption === "starttls"
            })
        })
    }

    return null
}