import { resolver } from "@blitzjs/rpc"
import db from "src/lib/db"
import { UpdateCategorySchema } from "../schemas"

export default resolver.pipe(
  resolver.zod(UpdateCategorySchema),
  resolver.authorize(),
  async ({ id, ...data }) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const category = await db.category.update({ where: { id }, data })

    return category
  }
)
