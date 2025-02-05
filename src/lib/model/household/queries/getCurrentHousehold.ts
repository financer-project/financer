import { Ctx } from "blitz"
import db from "@/db"
import changeCurrentHousehold from "@/src/lib/model/household/mutations/changeCurrentHousehold"
import { Household } from "@prisma/client"

export default async function getCurrentHousehold(_: null, ctx: Ctx): Promise<Household | null> {
    const privateData = await ctx.session.$getPrivateData()
    if (!privateData.currentHouseholdId) {
        const household = await db.household.findFirst()
        if (household) {
            return await changeCurrentHousehold({ id: household.id }, ctx)
        } else {
            return null
        }
    }

    return db.household.findFirst({ where: { id: privateData.currentHouseholdId } })
}
