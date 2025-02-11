import { paginate } from "blitz"
import { resolver } from "@blitzjs/rpc"
import db, { Prisma } from "@/db"

interface GetTransactionsInput
    extends Pick<Prisma.TransactionFindManyArgs, "where" | "orderBy" | "skip" | "take"> {
}

export default resolver.pipe(
    resolver.authorize(),
    async ({ where, orderBy, skip = 0, take = 100 }: GetTransactionsInput) => {
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
