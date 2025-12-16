import { AuthenticatedCtx, paginate } from "blitz"
import { resolver } from "@blitzjs/rpc"
import db, { Prisma } from "src/lib/db"
import { z } from "zod"
import getCurrentHousehold from "@/src/lib/model/household/queries/getCurrentHousehold"
import Guard from "@/src/lib/guard/ability"
import { getFindManySchema } from "@/src/lib/util/zod/zodUtil"
import TransactionWhereInput = Prisma.TransactionWhereInput
import TransactionOrderByWithRelationInput = Prisma.TransactionOrderByWithRelationInput

export const GetTransactionsSchema =
    getFindManySchema<TransactionWhereInput, TransactionOrderByWithRelationInput>().extend({
        householdId: z.uuid().optional()
    })

type GetTransactionsInput =
    Pick<Prisma.TransactionFindManyArgs, "where" | "orderBy" | "skip" | "take">
    & z.infer<typeof GetTransactionsSchema>

export default resolver.pipe(
    resolver.zod(GetTransactionsSchema),
    resolver.authorize(),
    async ({ where, orderBy, skip = 0, take = 100, householdId }: GetTransactionsInput, ctx: AuthenticatedCtx) => {
        if (!householdId) {
            householdId = (await getCurrentHousehold(null, ctx))?.id
        }

        orderBy ??= { valueDate: "desc" }
        where = {
            ...where, account: {
                householdId: householdId
            }
        }

        const { items: transactions, hasMore, nextPage, count } = await paginate({
            skip,
            take,
            count: () => db.transaction.count({ where }),
            query: (paginateArgs) => db.transaction.findMany({
                ...paginateArgs,
                where,
                orderBy,
                include: {
                    category: true,
                    counterparty: true,
                    account: true,
                    tags: { include: { tag: true } }
                }
            })
        })

        return { transactions, nextPage, hasMore, count }
    }
)
