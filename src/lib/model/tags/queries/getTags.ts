import { AuthenticatedCtx, paginate } from "blitz"
import { resolver } from "@blitzjs/rpc"
import { z } from "zod"
import db, { Prisma } from "@/src/lib/db"
import getHousehold from "@/src/lib/model/household/queries/getHousehold"
import getCurrentHousehold from "@/src/lib/model/household/queries/getCurrentHousehold"

export const GetTagsSchema = z.object({
    householdId: z.string().uuid()
})

type GetTagsInput = Pick<Prisma.TagFindManyArgs, "where" | "orderBy" | "skip" | "take"> & z.infer<typeof GetTagsSchema>

export default resolver.pipe(
    resolver.authorize(),
    async ({
               where,
               orderBy,
               skip = 0,
               take = 100,
               householdId
           }: GetTagsInput, ctxt: AuthenticatedCtx) => {

        let household
        if (householdId) {
            household = await getHousehold({ id: householdId }, ctxt)
        } else {
            household = await getCurrentHousehold(null, ctxt)
            if (!household) return { tags: [], nextPage: null, hasMore: false, count: 0 }
        }

        where = {
            ...where,
            householdId: household.id
        }

        const {
            items: tags,
            hasMore,
            nextPage,
            count
        } = await paginate({
            skip,
            take,
            count: () => db.tag.count({ where }),
            query: (paginateArgs) =>
                db.tag.findMany({ ...paginateArgs, where, orderBy })
        })

        return {
            tags,
            nextPage,
            hasMore,
            count
        }
    }
)
