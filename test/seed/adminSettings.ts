import { AdminSettings } from "@prisma/client"
import db from "@/src/lib/db"

export interface AdminSettingsSeed {
    settings: AdminSettings
}

export default async function seedAdminSettings(): Promise<AdminSettingsSeed> {
    const adminSettings = await db.adminSettings.create({
        data: {
            smtpHost: null,
            smtpPort: null,
            smtpUser: null,
            smtpPassword: null,
            smtpFromEmail: null,
            smtpEncryption: null,
            smtpFromName: "Financer App",
            allowRegistration: true,
            defaultLanguage: "en-US",
            defaultTheme: "light",
            onboardingCompleted: true
        }
    })
    return {
        settings: adminSettings
    }
}
