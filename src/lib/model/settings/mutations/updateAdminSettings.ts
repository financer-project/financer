import db from "@/src/lib/db"
import { Role } from "@prisma/client"
import { UpdateAdminSettingsSchema } from "@/src/lib/model/settings/schemas/adminSettings"
import { resolver } from "@blitzjs/rpc"

export default resolver.pipe(
    resolver.zod(UpdateAdminSettingsSchema),
    resolver.authorize(Role.ADMIN),
    async function updateAdminSettings(data) {
        // Update or create the admin settings
        return db.adminSettings.upsert({
            where: {
                id: 1 // Assuming there's only one admin settings record
            },
            update: data,
            create: {
                id: 1,
                ...data
            }
        })
    }
)
