import { resolver } from "@blitzjs/rpc"
import db from "@/db"
import { UpdateTransactionSchema } from "../schemas"

export default resolver.pipe(
  resolver.zod(UpdateTransactionSchema),
  resolver.authorize(),
  async ({ id, ...data }) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const transaction = await db.transaction.update({ where: { id }, data })

    return transaction
  }
)
