import { resolver } from "@blitzjs/rpc"
import db from "src/lib/db"
import { UpdateTransactionTemplateSchema } from "../schemas"
import Guard from "@/src/lib/guard/ability"
import { NotFoundError } from "blitz"

export default resolver.pipe(
    resolver.zod(UpdateTransactionTemplateSchema),
    resolver.authorize(),
    Guard.authorizePipe("update", "TransactionTemplate"),
    async ({ id, ...data }) => {
        const existing = await db.transactionTemplate.findFirst({ where: { id } })
        if (!existing) throw new NotFoundError()

        const startDateChanged = data.startDate.getTime() !== existing.startDate.getTime()

        return db.transactionTemplate.update({
            where: { id },
            data: {
                ...data,
                nextDueDate: startDateChanged ? data.startDate : existing.nextDueDate
            }
        })
    }
)
