import { resolver } from "@blitzjs/rpc"
import { UpdateTagSchema } from "../schemas"
import db from "@/src/lib/db"

export default resolver.pipe(
    resolver.zod(UpdateTagSchema),
    resolver.authorize(),
    async ({ id, ...data }) => {
        return db.tag.update({ where: { id }, data })
    }
)
