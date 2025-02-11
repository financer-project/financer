import { resolver } from "@blitzjs/rpc"
import db from "@/db"
import { DeleteTransactionSchema } from "../schemas"

export default resolver.pipe(
  resolver.zod(DeleteTransactionSchema),
  resolver.authorize(),
  async ({ id }) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const transaction = await db.transaction.deleteMany({ where: { id } })

    return transaction
  }
)
