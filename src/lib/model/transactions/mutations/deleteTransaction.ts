import { resolver } from "@blitzjs/rpc"
import db from "src/lib/db"
import { DeleteTransactionSchema } from "../schemas"

export default resolver.pipe(
  resolver.zod(DeleteTransactionSchema),
  resolver.authorize(),
  async ({ id }) => {
      return db.transaction.deleteMany({ where: { id } })
  }
)
