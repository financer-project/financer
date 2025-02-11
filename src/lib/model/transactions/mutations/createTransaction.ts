import { resolver } from "@blitzjs/rpc"
import db from "@/db"
import { CreateTransactionSchema } from "../schemas"
import { TransactionType } from "@prisma/client"

export default resolver.pipe(
    resolver.zod(CreateTransactionSchema),
    resolver.authorize(),
    async (transaction) => {
        transaction.amount = transaction.type === TransactionType.EXPENSE ? -Math.abs(transaction.amount) : Math.abs(transaction.amount)
        return await db.transaction.create({ data: { ...transaction } })
    }
)
