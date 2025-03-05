import { Ctx } from "blitz"
import db from "src/lib/db"
import changeCurrentHousehold from "@/src/lib/model/household/mutations/changeCurrentHousehold"
import { Household } from "@prisma/client"
import { resolver } from "@blitzjs/rpc"


export default resolver.pipe(
    resolver.authorize(),
    async (_: null, ctx: Ctx): Promise<Household | null> => {
        if (!ctx.session.userId) return null

        const privateData = await ctx.session.$getPrivateData()
        if (!privateData.currentHouseholdId) {
            const household = await db.household.findFirst({ where: { ownerId: ctx.session.userId } })
            if (household) {
                return changeCurrentHousehold({ id: household.id }, ctx)
            } else {
                return null
            }
        }

        return db.household.findFirst({ where: { id: privateData.currentHouseholdId } })
    }
)