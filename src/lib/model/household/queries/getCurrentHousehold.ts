import { Ctx } from "blitz"
import db from "src/lib/db"
import changeCurrentHousehold from "@/src/lib/model/household/mutations/changeCurrentHousehold"
import { Household } from "@prisma/client"
import { resolver } from "@blitzjs/rpc"

export default resolver.pipe(
    resolver.authorize(),
    async (_: null, ctx: Ctx): Promise<Household | null> => {
        if (!ctx.session.userId) return null

        const findNextHousehold = async (): Promise<Household | null> => {
            // Find a household where the user is a member with OWNER role first
            const ownerMembership = await db.householdMembership.findFirst({
                where: { 
                    userId: ctx.session.userId!,
                    role: "OWNER"
                },
                include: { household: true }
            })

            if (ownerMembership) {
                return changeCurrentHousehold({ id: ownerMembership.household.id }, ctx)
            }

            // If no household with OWNER role is found, try to find any household where the user is a member
            const membership = await db.householdMembership.findFirst({
                where: { userId: ctx.session.userId! },
                include: { household: true }
            })

            return membership ? changeCurrentHousehold({ id: membership.household.id }, ctx) : null
        }

        const privateData = await ctx.session.$getPrivateData()

        if (!privateData.currentHouseholdId) {
            return findNextHousehold()
        }

        const currentHousehold = await db.household.findFirst({ where: { id: privateData.currentHouseholdId } })
        if (!currentHousehold) { // private data is outdated
            return findNextHousehold()
        }

        // Check if the user still has access to this household
        const membership = await db.householdMembership.findFirst({
            where: { 
                userId: ctx.session.userId,
                householdId: currentHousehold.id
            }
        })

        if (!membership) {
            // User no longer has access to this household, find another one
            return findNextHousehold()
        }

        return currentHousehold
    }
)
