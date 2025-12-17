import { resolver } from "@blitzjs/rpc"
import { z } from "zod"
import db from "src/lib/db"
import { AuthorizationError, NotFoundError } from "blitz"

const ChangeCurrentHouseholdSchema = z.object({
    id: z.uuid()
})

export default resolver.pipe(
    resolver.zod(ChangeCurrentHouseholdSchema),
    resolver.authorize(),
    async ({ id }, ctx) => {
        const household = await db.household.findFirst({ where: { id } })
        if (!household) throw new NotFoundError()

        // Ensure the acting user is a member of the target household
        const membership = await db.householdMembership.findFirst({
            where: { householdId: id, userId: ctx.session.userId }
        })
        if (!membership) {
            throw new AuthorizationError()
        }

        await ctx.session.$setPrivateData({ currentHouseholdId: household.id })
        return household
    }
)