import { AuthenticatedCtx, paginate } from "blitz"
import { resolver } from "@blitzjs/rpc"
import db, { Prisma } from "db"

interface GetHouseholdsInput
    extends Pick<Prisma.HouseholdFindManyArgs, "where" | "orderBy" | "skip" | "take"> {
}

export default resolver.pipe(
    resolver.authorize(),
    async ({ where, orderBy, skip = 0, take = 100 }: GetHouseholdsInput, ctx: AuthenticatedCtx) => {
        const userId = ctx.session.userId
        if (!userId) {
            throw new Error("User is not authenticated")
        }

        where = {
            ...where,
            ownerId: userId
        }

        const {
            items: households,
            hasMore,
            nextPage,
            count
        } = await paginate({
            skip,
            take,
            count: () => db.household.count({ where }),
            query: (paginateArgs) => db.household.findMany({ ...paginateArgs, where, orderBy })
        })

        return {
            households,
            nextPage,
            hasMore,
            count
        }
    }
)
