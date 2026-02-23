import { resolver } from "@blitzjs/rpc"
import db from "src/lib/db"
import { CreateTransactionTemplateSchema } from "../schemas"
import Guard from "@/src/lib/guard/ability"
import { Ctx, NotFoundError } from "blitz"

export default resolver.pipe(
    resolver.zod(CreateTransactionTemplateSchema),
    resolver.authorize(),
    async (input, ctx: Ctx) => {
        const account = await db.account.findFirst({ where: { id: input.accountId } })
        if (!account) throw new NotFoundError(`Account with ID ${input.accountId} does not exist`)
        return { householdId: account.householdId, createdById: ctx.session.userId, ...input }
    },
    Guard.authorizePipe("create", "TransactionTemplate"),
    async (data) => {
        return db.transactionTemplate.create({
            data: {
                ...data,
                nextDueDate: data.startDate
            }
        })
    }
)
