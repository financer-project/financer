import { z } from "zod"

export const AdminSettingsSchema = z.object({
    // SMTP Settings
    smtpHost: z.string().nullable(),
    smtpPort: z.coerce.number().nullable(),
    smtpUser: z.string().nullable(),
    smtpPassword: z.string().nullable(),
    smtpFromEmail: z.string().email().nullable(),
    smtpFromName: z.string().nullable(),
    smtpEncryption: z.string().nullable(),

    // Registration Settings
    allowRegistration: z.boolean().default(true),

    // Default Settings
    defaultLanguage: z.string().default("en-US"),
    defaultTheme: z.string().default("light")
})

export const UpdateAdminSettingsSchema = AdminSettingsSchema
