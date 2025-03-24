import { resolver } from "@blitzjs/rpc"
import db from "src/lib/db"
import { DeleteCategorySchema } from "../schemas"

export default resolver.pipe(
  resolver.zod(DeleteCategorySchema),
  resolver.authorize(),
  async ({ id }) => {
      return db.category.deleteMany({ where: { id } })
  }
)
