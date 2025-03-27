import { resolver } from "@blitzjs/rpc"
import db from "src/lib/db"
import { CreateCategorySchema } from "../schemas"

export default resolver.pipe(
    resolver.zod(CreateCategorySchema),
    resolver.authorize(),
    async (input) => {
        if (input.parentId) {
            const parentCategory = await db.category.findFirst({ where: { id: input.parentId } })
            if (parentCategory?.type !== input.type) {
                throw new Error(`Type must be the same as parent (${parentCategory?.type}).`)
            }
        }
        return db.category.create({ data: input })
    }
)
