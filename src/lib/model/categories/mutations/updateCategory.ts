import { resolver } from "@blitzjs/rpc"
import db from "src/lib/db"
import { UpdateCategorySchema } from "../schemas"

export default resolver.pipe(
    resolver.zod(UpdateCategorySchema),
    resolver.authorize(),
    async ({ id, ...data }) => {
        return db.category.update({ where: { id }, data })
    }
)
