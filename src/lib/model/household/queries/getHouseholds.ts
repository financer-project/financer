import { AuthenticatedCtx, paginate } from "blitz"
import { resolver } from "@blitzjs/rpc"
import db, { Prisma } from "src/lib/db"
import { getFindManySchema } from "@/src/lib/util/zod/zodUtil"

export const GetHouseholdsSchema =
    getFindManySchema<Prisma.HouseholdWhereInput, Prisma.HouseholdOrderByWithRelationInput>()

export default resolver.pipe(
    resolver.zod(GetHouseholdsSchema),
    resolver.authorize(),
    async ({ where, orderBy, skip = 0, take = 100 }, ctx: AuthenticatedCtx) => {
        const userId = ctx.session.userId

        // Only households where the user is a member
        where = { ...where, OR: [{ members: { some: { userId } } }] }

        const { items: households, hasMore, nextPage, count } = await paginate({
            skip,
            take,
            count: () => db.household.count({ where }),
            query: (paginateArgs) => db.household.findMany({
                ...paginateArgs,
                where,
                orderBy,
                include: { members: { where: { userId }, select: { role: true } } }
            })
        })

        return { households, nextPage, hasMore, count }
    }
)
