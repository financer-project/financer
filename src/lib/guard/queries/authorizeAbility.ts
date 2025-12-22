import { resolver } from "@blitzjs/rpc"
import { z } from "zod"
import { Prisma } from "@prisma/client"
import Guard from "@/src/lib/guard/ability"
import db from "@/src/lib/db"

// Generic ability check that reuses the central Guard rules.
// Returns true if authorized, false otherwise.
const Input = z.object({
    action: z.enum(["create", "read", "update", "delete", "manage", "invite"]),
    resource: z.enum(Prisma.ModelName),
    // Optional parameters passed through to the respective Guard check
    // (e.g., { householdId }, { id }, ...)
    params: z.any().optional(),
    // If true, and params.householdId is missing, attempt to resolve the
    // current household from the session/memberships and inject it.
    useCurrentHousehold: z.boolean().optional()
})

export default resolver.pipe(
    resolver.zod(Input),
    resolver.authorize(),
    async ({ action, resource, params, useCurrentHousehold }, ctx) => {
        try {
            let finalParams = params ?? {}

            const resourcesScopedToHousehold: Prisma.ModelName[] = [
                Prisma.ModelName.Transaction,
                Prisma.ModelName.Category,
                Prisma.ModelName.Tag,
                Prisma.ModelName.ImportJob,
                Prisma.ModelName.Counterparty,
                Prisma.ModelName.Account
            ]

            const shouldTryResolveHousehold =
                (!finalParams?.householdId) && (
                    !!useCurrentHousehold || (action === "create" && resourcesScopedToHousehold.includes(resource))
                )

            if (shouldTryResolveHousehold) {
                const privateData = await ctx.session.$getPrivateData()
                let householdId: string | null = privateData?.currentHouseholdId ?? null

                // If none set on the session, find one via memberships
                if (!householdId && ctx.session.userId) {
                    // Prefer OWNER membership
                    const ownerMembership = await db.householdMembership.findFirst({
                        where: { userId: ctx.session.userId, role: "OWNER" },
                        select: { householdId: true }
                    })
                    if (ownerMembership) {
                        householdId = ownerMembership.householdId
                    } else {
                        const anyMembership = await db.householdMembership.findFirst({
                            where: { userId: ctx.session.userId },
                            select: { householdId: true }
                        })
                        if (anyMembership) householdId = anyMembership.householdId
                    }
                }

                if (householdId) {
                    finalParams = { ...finalParams, householdId }
                }
            }

            // Use Guard to check authorization with the computed params.
            await Guard.authorizePipe(action, resource)(finalParams, ctx)
            return true
        } catch {
            return false
        }
    }
)
