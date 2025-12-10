import { resolver } from "@blitzjs/rpc"
import db from "src/lib/db"
import { DeleteTransactionSchema } from "../schemas"
import Guard from "@/src/lib/guard/ability"

export default resolver.pipe(
    resolver.zod(DeleteTransactionSchema),
    resolver.authorize(),
    Guard.authorizePipe("delete", "Transaction"),
    async ({ id }) => {
        await db.transactonTags.deleteMany({ where: { transactionId: id } })
        return db.transaction.deleteMany({ where: { id } })
    }
)
