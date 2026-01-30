import { resolver } from "@blitzjs/rpc"
import db from "src/lib/db"
import { CreateHouseholdSchema } from "../schemas"
import { Ctx } from "blitz"
import { Household, HouseholdRole } from "@prisma/client"
import Guard from "@/src/lib/guard/ability"

export default resolver.pipe(
    resolver.zod(CreateHouseholdSchema),
    resolver.authorize(),
    Guard.authorizePipe("create", "Household"),
    async (input, ctx: Ctx): Promise<Household> => {
        // Create the household with createdBy
        const household = await db.household.create({
            data: {
                ...input,
                createdById: ctx.session.userId!
            }
        })

        // Add the current user as a member with OWNER role
        await db.householdMembership.create({
            data: {
                userId: ctx.session.userId!,
                householdId: household.id,
                role: HouseholdRole.OWNER
            }
        })

        return household
    }
)
