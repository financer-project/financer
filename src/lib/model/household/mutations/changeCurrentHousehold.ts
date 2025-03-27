import { resolver } from "@blitzjs/rpc"
import { z } from "zod"
import db from "src/lib/db"
import { NotFoundError } from "blitz"

const ChangeCurrentHouseholdSchema = z.object({
    id: z.string().uuid()
})

export default resolver.pipe(
    resolver.zod(ChangeCurrentHouseholdSchema),
    resolver.authorize(), async ({ id }, ctx) => {
        const household = await db.household.findFirst({ where: { id } })
        if (!household) throw new NotFoundError()
        await ctx.session.$setPrivateData({ currentHouseholdId: household.id })
        return household
    })