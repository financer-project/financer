import { AuthenticatedCtx, paginate } from "blitz"
import { resolver } from "@blitzjs/rpc"
import db, { Prisma } from "@/src/lib/db"
import { z } from "zod"
import getCurrentHousehold from "@/src/lib/model/household/queries/getCurrentHousehold"

const GetCounterpartiesSchema = z.object({
    householdId: z.string().uuid()
})

type GetCounterpartyInput =
    Pick<Prisma.CounterpartyFindManyArgs, "where" | "orderBy" | "skip" | "take">
    & z.infer<typeof GetCounterpartiesSchema>

export default resolver.pipe(
    resolver.authorize(),
    async ({ householdId, where = {}, orderBy, skip = 0, take = 100 }: GetCounterpartyInput, ctx: AuthenticatedCtx) => {
        let id = householdId

        if (!id) {
            const currentHousehold = await getCurrentHousehold(null, ctx)
            if (!currentHousehold) return { counterparties: [], nextPage: null, hasMore: false, count: 0 }
            id = currentHousehold.id
        }

        // Ensure we only get counterparties for the specified household
        const whereWithHousehold = {
            ...where,
            householdId: id
        }

        const {
            items: counterparties,
            hasMore,
            nextPage,
            count
        } = await paginate({
            skip,
            take,
            count: () => db.counterparty.count({ where: whereWithHousehold }),
            query: (paginateArgs) =>
                db.counterparty.findMany({ ...paginateArgs, where: whereWithHousehold, orderBy })
        })

        return {
            counterparties,
            nextPage,
            hasMore,
            count
        }
    }
)
