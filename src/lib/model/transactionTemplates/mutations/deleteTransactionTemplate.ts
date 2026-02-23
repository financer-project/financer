import { resolver } from "@blitzjs/rpc"
import db from "src/lib/db"
import { DeleteTransactionTemplateSchema } from "../schemas"
import Guard from "@/src/lib/guard/ability"

export default resolver.pipe(
    resolver.zod(DeleteTransactionTemplateSchema),
    resolver.authorize(),
    Guard.authorizePipe("delete", "TransactionTemplate"),
    async ({ id }) => {
        return db.transactionTemplate.delete({ where: { id } })
    }
)
