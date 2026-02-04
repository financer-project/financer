import { resolver } from "@blitzjs/rpc"
import db from "@/src/lib/db"
import { SetDefaultAccountSchema } from "@/src/lib/model/household/schemas"
import { Ctx, NotFoundError } from "blitz"

export default resolver.pipe(
    resolver.zod(SetDefaultAccountSchema),
    resolver.authorize(),
    async ({ householdId, accountId }, ctx: Ctx) => {
        // Verify user is a member of the household
        const membership = await db.householdMembership.findFirst({
            where: { householdId, userId: ctx.session.userId! }
        })
        if (!membership) throw new NotFoundError("Membership not found")

        // If setting an account, verify it belongs to the household
        if (accountId) {
            const account = await db.account.findFirst({
                where: { id: accountId, householdId }
            })
            if (!account) throw new NotFoundError("Account not found in this household")
        }

        return db.householdMembership.update({
            where: { id: membership.id },
            data: { defaultAccountId: accountId }
        })
    }
)
