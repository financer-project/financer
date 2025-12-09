import { z } from "zod"

export const AdminSettingsSchema = z.object({
    // SMTP Settings
    smtpHost: z.string().nullable(),
    smtpPort: z.coerce.number().nullable(),
    smtpUser: z.string().nullable(),
    smtpPassword: z.string().nullable(),
    smtpFromEmail: z.email().nullable(),
    smtpFromName: z.string().nullable(),
    smtpEncryption: z.string().nullable(),

    // Registration Settings
    allowRegistration: z.boolean().default(true),

    // Security Settings
    invitationTokenExpirationHours: z.coerce.number().min(1).max(168).default(72), // 1 hour to 7 days, default 3 days
    resetPasswordTokenExpirationHours: z.coerce.number().min(1).max(24).default(4), // 1 to 24 hours, default 4 hours

    // Default Settings
    defaultLanguage: z.string().default("en-US"),
    defaultTheme: z.string().default("light"),

    // Onboarding Settings
    onboardingCompleted: z.boolean().default(false)
})

export const UpdateAdminSettingsSchema = AdminSettingsSchema
