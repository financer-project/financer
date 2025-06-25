import { resolver } from "@blitzjs/rpc"
import { CreateTagSchema } from "../schemas"
import db from "@/src/lib/db"
import Guard from "@/src/lib/guard/ability"

export default resolver.pipe(
    resolver.zod(CreateTagSchema),
    resolver.authorize(),
    Guard.authorizePipe("create", "Tag"),
    async (input) => {
        return db.tag.create({ data: input })
    }
)
