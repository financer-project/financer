import { resolver } from "@blitzjs/rpc"
import db from "src/lib/db"
import { UpdateCategorySchema } from "../schemas"
import Guard from "@/src/lib/guard/ability"

export default resolver.pipe(
    resolver.zod(UpdateCategorySchema),
    resolver.authorize(),
    Guard.authorizePipe("update", "Category"),
    async ({ id, ...data }) => {
        return db.category.update({ where: { id }, data })
    }
)
