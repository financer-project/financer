import { resolver } from "@blitzjs/rpc"
import db from "src/lib/db"

export default resolver.pipe(
    resolver.authorize(),
    async (i, ctx) => {
        const settings = await db.settings.findFirst({ where: { userId: ctx.session.userId } })

        if (!settings) {
            return await db.settings.create({
                data: {
                    userId: ctx.session.userId,
                    language: "en-US",
                    theme: "light"
                }
            })
        }

        return settings
    }
)

