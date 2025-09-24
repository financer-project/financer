import { AuthenticatedCtx, paginate } from "blitz"
import { resolver } from "@blitzjs/rpc"
import db, { Prisma } from "src/lib/db"
import { z } from "zod"
import getHousehold from "@/src/lib/model/household/queries/getHousehold"
import getCurrentHousehold from "@/src/lib/model/household/queries/getCurrentHousehold"

export const GetTransactionsSchema = z.object({
    householdId: z.uuid().optional()
})

type GetTransactionsInput =
    Pick<Prisma.TransactionFindManyArgs, "where" | "orderBy" | "skip" | "take">
    & z.infer<typeof GetTransactionsSchema>

export default resolver.pipe(
    resolver.authorize(),
    async ({ where, orderBy, skip = 0, take = 100, householdId }: GetTransactionsInput, ctxt: AuthenticatedCtx) => {

        let household;
        if (householdId) {
            household = await getHousehold({ id: householdId }, ctxt);
        } else {
            household = await getCurrentHousehold(null, ctxt);
            if (!household) return { transactions: [], nextPage: null, hasMore: false, count: 0 };
        }

        orderBy ??= { valueDate: "desc" }
        where = {
            ...where, account: {
                householdId: household.id
            }
        }

        const {
            items: transactions,
            hasMore,
            nextPage,
            count
        } = await paginate({
            skip,
            take,
            count: () => db.transaction.count({ where }),
            query: (paginateArgs) => db.transaction.findMany({
                ...paginateArgs,
                where,
                orderBy,
                include: { 
                    category: true,
                    tags: {
                        include: {
                            tag: true
                        }
                    },
                    counterparty: true
                }
            })
        })

        return {
            transactions,
            nextPage,
            hasMore,
            count
        }
    }
)
