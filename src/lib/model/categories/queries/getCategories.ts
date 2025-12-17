import { resolver } from "@blitzjs/rpc"
import db, { Prisma } from "src/lib/db"
import { z } from "zod"
import getCurrentHousehold from "@/src/lib/model/household/queries/getCurrentHousehold"
import { getFindManySchema } from "@/src/lib/util/zod/zodUtil"
import CategoryWhereInput = Prisma.CategoryWhereInput
import CategoryOrderByWithRelationInput = Prisma.CategoryOrderByWithRelationInput

const GetCategories =
    getFindManySchema<CategoryWhereInput, CategoryOrderByWithRelationInput>().extend({
        householdId: z.uuid().optional()
    })

export default resolver.pipe(
    resolver.zod(GetCategories),
    resolver.authorize(),
    async ({ householdId, where, orderBy }, ctx) => {
        if (!householdId) {
            householdId = (await getCurrentHousehold(null, ctx))?.id
        }
        return db.category.findMany({ where: { ...where, householdId }, orderBy })
    }
)
