import { Ctx } from "blitz"
import db from "@/db"

export default async function getCurrentHousehold(_: null, ctx: Ctx) {
    const privateData = await ctx.session.$getPrivateData()
    if (!privateData.currentHouseholdId) return null

    return db.household.findFirst({ where: { id: privateData.currentHouseholdId } })
}
