import { resolver } from "@blitzjs/rpc"
import db, { Prisma } from "@/src/lib/db"
import { Role } from "@prisma/client"
import { paginate } from "blitz"

type GetUsersInput = Pick<Prisma.UserFindManyArgs, "where" | "orderBy" | "skip" | "take">

export default resolver.pipe(
    resolver.authorize(Role.ADMIN),
    async ({ where, orderBy, skip = 0, take = 100 }: GetUsersInput) => {

        orderBy ??= { lastName: "asc" }

        const {
            items: users,
            hasMore,
            nextPage,
            count
        } = await paginate({
            skip,
            take,
            count: () => db.user.count({ where }),
            query: (paginateArgs) => db.user.findMany({
                ...paginateArgs,
                where,
                orderBy
            })
        })

        return {
            users,
            nextPage,
            hasMore,
            count
        }
    }
)
