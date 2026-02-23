import db from "@/src/lib/db"
import { Role } from "@prisma/client"
import { UpdateAdminSettingsSchema } from "@/src/lib/model/settings/schemas/adminSettings"
import { resolver } from "@blitzjs/rpc"
import { registerTransactionTemplatesJob, timeToCron } from "@/src/lib/jobs"

export default resolver.pipe(
    resolver.zod(UpdateAdminSettingsSchema),
    resolver.authorize(Role.ADMIN),
    async function updateAdminSettings(data) {
        const existing = await db.adminSettings.findUnique({ where: { id: 1 } })

        const result = await db.adminSettings.upsert({
            where: { id: 1 },
            update: data,
            create: { id: 1, ...data }
        })

        if (data.transactionTemplateCronTime !== existing?.transactionTemplateCronTime) {
            await registerTransactionTemplatesJob(timeToCron(data.transactionTemplateCronTime))
        }

        return result
    }
)
