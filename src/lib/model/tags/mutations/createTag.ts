import { resolver } from "@blitzjs/rpc"
import { CreateTagSchema } from "../schemas"
import db from "@/src/lib/db"

export default resolver.pipe(
    resolver.zod(CreateTagSchema),
    resolver.authorize(),
    async (input) => {
        return db.tag.create({ data: input })
    }
)
