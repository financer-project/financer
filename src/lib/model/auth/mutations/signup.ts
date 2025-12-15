import db from "@/src/lib/db"
import { SecurePassword } from "@blitzjs/auth/secure-password"
import { AuthenticatedCtx } from "blitz"
import { Role } from "@prisma/client"
import { hash256 } from "@blitzjs/auth"
import { performAddHouseholdMember } from "@/src/lib/model/household/mutations/addHouseholdMember"

export default async function signup(
    input: {
        firstName: string
        lastName: string
        password: string
        email: string
        token?: string
    },
    ctx: AuthenticatedCtx
) {
    const blitzContext = ctx

    // Get admin settings to check if registration is allowed
    let adminSettings = await db.adminSettings.findFirst()

    // If registration is not allowed OR a token is presented, validate token
    let invitationToken: { id: string, type: string, content?: any } | null = null
    if (!adminSettings?.allowRegistration || input.token) {
        if (!input.token) {
            throw new Error("Registration is currently by invitation only. Please use an invitation link.")
        }

        const hashedToken = hash256(input.token)

        // Find the token in the database (accept both generic and household invitations)
        const token = await db.token.findFirst({
            where: {
                hashedToken,
                type: { in: ["INVITATION", "INVITATION_HOUSEHOLD"] },
                sentTo: input.email,
                expiresAt: { gt: new Date() }
            }
        })

        if (!token) {
            throw new Error("Invalid or expired invitation token.")
        }

        invitationToken = { id: token.id, type: token.type, content: (token as any).content }
        // Note: We will delete the token after creating the user and processing household membership
    }

    // Create the user
    const hashedPassword = await SecurePassword.hash(input.password)
    const user = await db.user.create({
        data: {
            firstName: input.firstName,
            lastName: input.lastName,
            email: input.email,
            hashedPassword: hashedPassword
        }
    })

    // If this is a household invitation, attach the user to the household
    if (invitationToken?.type === "INVITATION_HOUSEHOLD") {
        const payload = invitationToken.content as { householdId?: string, role?: any, accessLevel?: any } | undefined
        if (payload?.householdId && payload?.role && payload?.accessLevel) {
            try {
                await performAddHouseholdMember({
                    householdId: payload.householdId,
                    userId: user.id,
                    role: payload.role,
                    accessLevel: payload.accessLevel
                })
            } catch {
                // Silently ignore membership creation errors here; the user is still created
            }
        }
    }

    // Delete the token so it can't be used again
    if (invitationToken) {
        await db.token.delete({ where: { id: invitationToken.id } })
    }

    await blitzContext.session.$create({ userId: user.id, email: user.email, role: Role.USER })

    return { userId: blitzContext.session.userId, ...user, email: input.email }
}
