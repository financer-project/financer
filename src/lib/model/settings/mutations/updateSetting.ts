import { resolver } from "@blitzjs/rpc"
import db from "src/lib/db"
import { UpdateSettingSchema } from "@/src/lib/model/settings/schemas"
import getSetting from "@/src/lib/model/settings/queries/getSetting"

export default resolver.pipe(
    resolver.zod(UpdateSettingSchema),
    resolver.authorize(),
    async ({ userId, ...data }, ctx) => {
        await getSetting({ userId }, ctx)
        return db.settings.update({ where: { userId }, data })
    }
)
