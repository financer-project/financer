import db from "@/src/lib/db"
import { resolver } from "@blitzjs/rpc"
import { AdminSettings, Role } from "@prisma/client"

export default resolver.pipe(
    resolver.authorize(Role.ADMIN),
    async (): Promise<AdminSettings> => {
        // Get the admin settings from the database
        let adminSettings = await db.adminSettings.findFirst()

        // If no admin settings exist yet, return default values
        adminSettings ??= await db.adminSettings.create({
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

            }
        })

        return adminSettings
    }
)
