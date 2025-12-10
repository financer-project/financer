import { resolver } from "@blitzjs/rpc"
import db from "@/src/lib/db"
import Guard from "@/src/lib/guard/ability"
import { RemoveHouseholdMemberSchema } from "@/src/lib/model/household/schemas"
import { AuthorizationError, Ctx, NotFoundError } from "blitz"
import { HouseholdRole } from "@prisma/client"

export default resolver.pipe(
    resolver.zod(RemoveHouseholdMemberSchema),
    resolver.authorize(),
    Guard.authorizePipe("update", "Household"),
    async ({ id, userId }, ctx: Ctx) => {
        const membership = await db.householdMembership.findFirst({ where: { householdId: id, userId } })
        if (!membership) throw new NotFoundError()

        // Prevent removing the last owner
        if (membership.role === HouseholdRole.OWNER) {
            const ownerCount = await db.householdMembership.count({ where: { householdId: id, role: HouseholdRole.OWNER } })
            if (ownerCount <= 1) {
                throw new AuthorizationError("Cannot remove the last owner. Transfer ownership first.")
            }
        }

        // Non-owners cannot remove owners; only OWNER can remove another OWNER
        if (membership.role === HouseholdRole.OWNER) {
            const acting = await db.householdMembership.findFirst({ where: { householdId: id, userId: ctx.session.userId! } })
            if (!acting || acting.role !== HouseholdRole.OWNER) {
                throw new AuthorizationError()
            }
        }

        await db.householdMembership.delete({ where: { id: membership.id } })
        return true
    }
)
