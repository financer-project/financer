import { Ctx } from "blitz"
import db from "src/lib/db"
import { resolver } from "@blitzjs/rpc"
import { z } from "zod"

const GetCurrentMembershipSchema = z.object({
    householdId: z.uuid()
})

export default resolver.pipe(
    resolver.zod(GetCurrentMembershipSchema),
    resolver.authorize(),
    async ({ householdId }, ctx: Ctx) => {
        if (!ctx.session.userId) return null

        const membership = await db.householdMembership.findFirst({
            where: {
                userId: ctx.session.userId,
                householdId
            },
            include: {
                defaultAccount: true
            }
        })

        return membership
    }
)
