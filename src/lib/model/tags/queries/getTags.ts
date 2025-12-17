import { paginate } from "blitz"
import { resolver } from "@blitzjs/rpc"
import { z } from "zod"
import db, { Prisma } from "@/src/lib/db"
import getCurrentHousehold from "@/src/lib/model/household/queries/getCurrentHousehold"
import { getFindManySchema } from "@/src/lib/util/zod/zodUtil"

export const GetTagsSchema =
    getFindManySchema<Prisma.TagWhereInput, Prisma.TagOrderByWithRelationInput>().extend({
        householdId: z.uuid().optional()
    })

type GetTagsInput = Pick<Prisma.TagFindManyArgs, "where" | "orderBy" | "skip" | "take"> & z.infer<typeof GetTagsSchema>

export default resolver.pipe(
    resolver.zod(GetTagsSchema),
    resolver.authorize(),
    async ({ where, orderBy, skip = 0, take = 100, householdId }: GetTagsInput, ctx) => {
        if (!householdId) {
            householdId = (await getCurrentHousehold(null, ctx))?.id
        }

        where = { ...where, householdId }

        const { items: tags, hasMore, nextPage, count } = await paginate({
            skip,
            take,
            count: () => db.tag.count({ where }),
            query: (paginateArgs) => db.tag.findMany({ ...paginateArgs, where, orderBy })
        })

        return { tags, nextPage, hasMore, count }
    }
)
