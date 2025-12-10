import { resolver } from "@blitzjs/rpc"
import db from "@/src/lib/db"
import Guard from "@/src/lib/guard/ability"
import { AddHouseholdMemberSchema } from "@/src/lib/model/household/schemas"
import { AuthorizationError, NotFoundError } from "blitz"
import { HouseholdRole } from "@prisma/client"

export default resolver.pipe(
    resolver.zod(AddHouseholdMemberSchema),
    resolver.authorize(),
    Guard.authorizePipe("invite", "Household"),
    async ({ id, email, role, accessLevel }) => {
        const household = await db.household.findFirst({ where: { id } })
        if (!household) throw new NotFoundError()

        const user = await db.user.findFirst({ where: { email: email.toLowerCase() } })
        if (!user) {
            throw new NotFoundError("No user with this email was found. Ask them to sign up first or use an invitation flow.")
        }

        const existing = await db.householdMembership.findFirst({ where: { userId: user.id, householdId: id } })
        if (existing) {
            return existing
        }

        // Ensure there is only one OWNER per household
        if (role === HouseholdRole.OWNER) {
            const ownerCount = await db.householdMembership.count({ where: { householdId: id, role: HouseholdRole.OWNER } })
            if (ownerCount > 0) {
                throw new AuthorizationError("This household already has an owner.")
            }
        }

        return db.householdMembership.create({
            data: {
                userId: user.id,
                householdId: id,
                role,
                accessLevel
            }
        })
    }
)
