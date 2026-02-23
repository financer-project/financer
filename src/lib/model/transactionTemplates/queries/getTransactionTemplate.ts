import { NotFoundError } from "blitz"
import { resolver } from "@blitzjs/rpc"
import db from "src/lib/db"
import { z } from "zod"
import { Prisma } from ".prisma/client"
import Guard from "@/src/lib/guard/ability"

export type TransactionTemplateModel = Prisma.TransactionTemplateGetPayload<{
    include: {
        account: true
        category: true
        counterparty: true
        createdBy: true
        transactions: {
            include: {
                category: true
                account: true
            }
            orderBy: { valueDate: "desc" }
            take: 10
        }
    }
}>

const GetTransactionTemplate = z.object({
    id: z.uuid()
})

export default resolver.pipe(
    resolver.zod(GetTransactionTemplate),
    resolver.authorize(),
    Guard.authorizePipe("read", "TransactionTemplate"),
    async ({ id }): Promise<TransactionTemplateModel> => {
        const template = await db.transactionTemplate.findFirst({
            where: { id },
            include: {
                account: true,
                category: true,
                counterparty: true,
                createdBy: true,
                transactions: {
                    include: {
                        category: true,
                        account: true
                    },
                    orderBy: { valueDate: "desc" },
                    take: 10
                }
            }
        })

        if (!template) throw new NotFoundError()

        return template
    }
)
