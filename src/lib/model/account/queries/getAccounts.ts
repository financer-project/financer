import { paginate } from "blitz"
import { resolver } from "@blitzjs/rpc"
import db, { Prisma } from "@/src/lib/db"

interface GetAccountsInput
    extends Pick<Prisma.AccountFindManyArgs, "where" | "orderBy" | "skip" | "take"> {
    householdId: string
}

export default resolver.pipe(
    resolver.authorize(),
    async ({ where, orderBy, skip = 0, take = 100, householdId }: GetAccountsInput) => {
        where = {
            ...where,
            householdId: householdId
        }

        const {
            items: accounts,
            hasMore,
            nextPage,
            count
        } = await paginate({
            skip,
            take,
            count: () => db.account.count({ where }),
            query: (paginateArgs) =>
                db.account.findMany({ ...paginateArgs, where, orderBy })
        })

        return {
            accounts,
            nextPage,
            hasMore,
            count
        }
    }
)
