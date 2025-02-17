import { resolver } from "@blitzjs/rpc"
import db from "src/lib/db"
import { UpdateTransactionSchema } from "../schemas"
import { TransactionType } from "@prisma/client"

export default resolver.pipe(
    resolver.zod(UpdateTransactionSchema),
    resolver.authorize(),
    async ({ id, ...transaction }) => {
        transaction.amount = transaction.type === TransactionType.EXPENSE ? -Math.abs(transaction.amount) : Math.abs(transaction.amount)
        return db.transaction.update({ where: { id }, data: transaction })
    }
)
