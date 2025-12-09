import { resolver } from "@blitzjs/rpc"
import db from "@/src/lib/db"
import Guard from "@/src/lib/guard/ability"
import { AddHouseholdMemberSchema } from "@/src/lib/model/household/schemas"
import { NotFoundError } from "blitz"

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
