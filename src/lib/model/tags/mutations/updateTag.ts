import { resolver } from "@blitzjs/rpc"
import { UpdateTagSchema } from "../schemas"
import db from "@/src/lib/db"
import Guard from "@/src/lib/guard/ability"

export default resolver.pipe(
    resolver.zod(UpdateTagSchema),
    resolver.authorize(),
    Guard.authorizePipe("update", "Tag"),
    async ({ id, ...data }) => {
        return db.tag.update({ where: { id }, data })
    }
)
