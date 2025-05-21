import { AuthenticatedCtx, paginate } from "blitz"
import { resolver } from "@blitzjs/rpc"
import db, { Prisma } from "src/lib/db"
import { z } from "zod"
import getHousehold from "@/src/lib/model/household/queries/getHousehold"

const GetTransactionsSchema = z.object({
    householdId: z.string().uuid()
})

type GetTransactionsInput =
    Pick<Prisma.TransactionFindManyArgs, "where" | "orderBy" | "skip" | "take">
    & z.infer<typeof GetTransactionsSchema>

export default resolver.pipe(
    resolver.authorize(),
    async ({ where, orderBy, skip = 0, take = 100, householdId }: GetTransactionsInput, ctxt: AuthenticatedCtx) => {

        const household = await getHousehold({ id: householdId }, ctxt)

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
                include: { category: true }
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
