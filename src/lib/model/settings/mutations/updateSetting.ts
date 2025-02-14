import { resolver } from "@blitzjs/rpc"
import db from "src/lib/db"
import { UpdateSettingSchema } from "@/src/lib/model/settings/schemas"

export default resolver.pipe(
    resolver.zod(UpdateSettingSchema),
    resolver.authorize(),
    async ({ userId, ...data }) => {
        return await db.settings.update({ where: { userId }, data })
    }
)
