import { resolver } from "@blitzjs/rpc"
import db from "src/lib/db"
import { DeleteCategorySchema } from "../schemas"
import Guard from "@/src/lib/guard/ability"

export default resolver.pipe(
    resolver.zod(DeleteCategorySchema),
    resolver.authorize(),
    Guard.authorizePipe("delete", "Category"),
    async ({ id }) => {
        return db.category.deleteMany({ where: { id } })
    }
)
