import { NotFoundError } from "blitz"
import { resolver } from "@blitzjs/rpc"
import db from "src/lib/db"
import { z } from "zod"
import { Prisma } from ".prisma/client"
import Guard from "@/src/lib/guard/ability"

export type TransactionModel = Prisma.TransactionGetPayload<{
    include: {
        category: true,
        account: true,
        counterparty: true,
        tags: {
            include: {
                tag: true
            }
        },
        attachments: true,
        createdBy: true
    }
}>;

const GetTransaction = z.object({
    id: z.uuid()
})

export default resolver.pipe(
    resolver.zod(GetTransaction),
    resolver.authorize(),
    Guard.authorizePipe("read", "Transaction"),
    async ({ id }): Promise<TransactionModel> => {
        const transaction = await db.transaction.findFirst({
            where: { id },
            include: {
                category: true,
                account: true,
                counterparty: true,
                tags: {
                    include: {
                        tag: true
                    }
                },
                attachments: true,
                createdBy: true
            }
        })

        if (!transaction) throw new NotFoundError()

        return transaction
    }
)
