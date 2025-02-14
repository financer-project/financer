import { resolver } from "@blitzjs/rpc"
import db from "src/lib/db"
import { DeleteCategorySchema } from "../schemas"

export default resolver.pipe(
  resolver.zod(DeleteCategorySchema),
  resolver.authorize(),
  async ({ id }) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const category = await db.category.deleteMany({ where: { id } })

    return category
  }
)
