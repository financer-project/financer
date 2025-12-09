import { resolver } from "@blitzjs/rpc"
import db from "@/src/lib/db"
import Guard from "@/src/lib/guard/ability"
import { UpdateHouseholdMemberSchema } from "@/src/lib/model/household/schemas"
import { AuthorizationError, Ctx, NotFoundError } from "blitz"
import { HouseholdRole } from "@prisma/client"

export default resolver.pipe(
    resolver.zod(UpdateHouseholdMemberSchema),
    resolver.authorize(),
    Guard.authorizePipe("update", "Household"),
    async ({ id, userId, role, accessLevel }, ctx: Ctx) => {
        const membership = await db.householdMembership.findFirst({ where: { householdId: id, userId } })
        if (!membership) throw new NotFoundError()

        // Only OWNERs may change another OWNER's role
        if (membership.role === HouseholdRole.OWNER) {
            const acting = await db.householdMembership.findFirst({ where: { householdId: id, userId: ctx.session.userId! } })
            if (!acting || acting.role !== HouseholdRole.OWNER) {
                throw new AuthorizationError()
            }
        }

        // Prevent removing last OWNER via role change
        if (membership.role === HouseholdRole.OWNER && role !== HouseholdRole.OWNER) {
            const ownerCount = await db.householdMembership.count({ where: { householdId: id, role: HouseholdRole.OWNER } })
            if (ownerCount <= 1) {
                throw new AuthorizationError("Cannot demote the last owner. Transfer ownership first.")
            }
        }

        return db.householdMembership.update({
            where: { id: membership.id },
            data: { role, accessLevel }
        })
    }
)
