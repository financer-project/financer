import { resolver } from "@blitzjs/rpc"
import { DeleteTagSchema } from "../schemas"
import db from "@/src/lib/db"
import Guard from "@/src/lib/guard/ability"

export default resolver.pipe(
    resolver.zod(DeleteTagSchema),
    resolver.authorize(),
    Guard.authorizePipe("delete", "Tag"),
    async ({ id }) => {
        // First delete all relationships between this tag and transactions
        await db.transactonTags.deleteMany({
            where: { tagId: id }
        })

        // Then delete the tag itself
        return db.tag.deleteMany({ where: { id } })
    }
)
