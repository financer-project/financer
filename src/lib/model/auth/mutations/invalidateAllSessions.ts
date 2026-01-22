import db from "@/src/lib/db"
import { resolver } from "@blitzjs/rpc"

export default resolver.pipe(
    resolver.authorize(),
    async (_, ctx) => {
        const userId = ctx.session.userId
        const currentHandle = ctx.session.$handle

        await db.session.deleteMany({
            where: {
                userId,
                handle: { not: currentHandle }
            }
        })

        return true
    }
)
