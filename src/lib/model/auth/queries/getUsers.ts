import { resolver } from "@blitzjs/rpc"
import db, { Prisma } from "@/src/lib/db"
import { Role } from "@prisma/client"
import { paginate } from "blitz"
import { z } from "zod"
import { getFindManySchema } from "@/src/lib/util/zod/zodUtil"
import Guard from "@/src/lib/guard/ability"

export const GetUsersSchema =
    getFindManySchema<Prisma.UserWhereInput, Prisma.UserOrderByWithRelationInput>()

type GetUsersInput = Pick<Prisma.UserFindManyArgs, "where" | "orderBy" | "skip" | "take"> & z.infer<typeof GetUsersSchema>

export default resolver.pipe(
    resolver.zod(GetUsersSchema),
    resolver.authorize(Role.ADMIN),
    Guard.authorizePipe("manage", "all"),
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
