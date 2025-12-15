import { resolver } from "@blitzjs/rpc"
import db from "@/src/lib/db"
import Guard from "@/src/lib/guard/ability"
import { AddHouseholdMemberSchema } from "@/src/lib/model/household/schemas"
import { AuthorizationError } from "blitz"
import { AccessLevel, HouseholdRole } from "@prisma/client"

export async function performAddHouseholdMember(params: {
    householdId: string
    userId: string
    role: HouseholdRole
    accessLevel: AccessLevel
}) {
    // Ensure there is only one OWNER per household
    if (params.role === HouseholdRole.OWNER) {
        const ownerCount = await db.householdMembership.count({ where: { householdId: params.householdId, role: HouseholdRole.OWNER } })
        if (ownerCount > 0) {
            throw new AuthorizationError("This household already has an owner.")
        }
    }

    // Idempotency: return existing membership if present
    const existing = await db.householdMembership.findFirst({ where: { userId: params.userId, householdId: params.householdId } })
    if (existing) return existing

    return db.householdMembership.create({
        data: {
            userId: params.userId,
            householdId: params.householdId,
            role: params.role,
            accessLevel: params.accessLevel
        }
    })
}

export default resolver.pipe(
    resolver.zod(AddHouseholdMemberSchema),
    resolver.authorize(),
    Guard.authorizePipe("invite", "Household"),
    async ({ id, userId, role, accessLevel }) => {
        // Validate household exists
        const household = await db.household.findFirst({ where: { id } })
        if (!household) throw new Error("Household not found")

        // Add membership (idempotent) and return
        return performAddHouseholdMember({ householdId: id, userId, role, accessLevel })
    }
)
