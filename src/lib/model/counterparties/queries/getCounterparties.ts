import { paginate } from "blitz"
import { resolver } from "@blitzjs/rpc"
import db, { Prisma } from "@/src/lib/db"
import { z } from "zod"
import getCurrentHousehold from "@/src/lib/model/household/queries/getCurrentHousehold"
import { getFindManySchema } from "@/src/lib/util/zod/zodUtil"

export const GetCounterpartiesSchema =
    getFindManySchema<Prisma.CounterpartyWhereInput, Prisma.CounterpartyOrderByWithRelationInput>().extend({
        householdId: z.uuid().optional()
    })

export default resolver.pipe(
    resolver.zod(GetCounterpartiesSchema),
    resolver.authorize(),
    async ({ householdId, where = {}, orderBy, skip = 0, take = 100 }, ctx) => {
        if (!householdId) {
            householdId = (await getCurrentHousehold(null, ctx))?.id
        }

        const whereWithHousehold = { ...where, householdId }

        const { items: counterparties, hasMore, nextPage, count } = await paginate({
            skip,
            take,
            count: () => db.counterparty.count({ where: whereWithHousehold }),
            query: (paginateArgs) => db.counterparty.findMany({ ...paginateArgs, where: whereWithHousehold, orderBy })
        })

        return { counterparties, nextPage, hasMore, count }
    }
)
