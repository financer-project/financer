import { paginate } from "blitz"
import { resolver } from "@blitzjs/rpc"
import db, { Prisma } from "@/src/lib/db"
import { z } from "zod"
import Guard from "@/src/lib/guard/ability"
import getCurrentHousehold from "@/src/lib/model/household/queries/getCurrentHousehold"
import { getFindManySchema } from "@/src/lib/util/zod/zodUtil"

export const GetAccountsSchema =
    getFindManySchema<Prisma.AccountWhereInput, Prisma.AccountOrderByWithRelationInput>().extend({
        householdId: z.uuid().optional()
    })

export default resolver.pipe(
    resolver.zod(GetAccountsSchema),
    resolver.authorize(),
    async ({ where, orderBy, skip = 0, take = 100, householdId }, ctx) => {
        if (!householdId) {
            householdId = (await getCurrentHousehold(null, ctx))?.id
        }

        where = { ...where, householdId }

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
