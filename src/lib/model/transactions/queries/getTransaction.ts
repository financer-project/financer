import { NotFoundError } from "blitz"
import { resolver } from "@blitzjs/rpc"
import db from "@/db"
import { z } from "zod"
import { Prisma } from ".prisma/client"

export type TransactionModel = Prisma.TransactionGetPayload<{ include: { category: true, account: true } }>;

const GetTransaction = z.object({
    id: z.string().uuid()
})

export default resolver.pipe(
    resolver.zod(GetTransaction),
    resolver.authorize(),
    async ({ id }): Promise<TransactionModel> => {
        const transaction = await db.transaction.findFirst({ where: { id }, include: { category: true, account: true } })

        if (!transaction) throw new NotFoundError()

        return transaction
    }
)
