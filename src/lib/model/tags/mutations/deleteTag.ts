import { resolver } from "@blitzjs/rpc"
import { DeleteTagSchema } from "../schemas"
import db from "@/src/lib/db"

export default resolver.pipe(
    resolver.zod(DeleteTagSchema),
    resolver.authorize(),
    async ({ id }) => {
        // First delete all relationships between this tag and transactions
        await db.transactonTags.deleteMany({
            where: { tagId: id }
        })

        // Then delete the tag itself
        return db.tag.deleteMany({ where: { id } })
    }
)
