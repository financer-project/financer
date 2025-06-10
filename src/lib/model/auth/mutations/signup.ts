import db from "@/src/lib/db"
import { SecurePassword } from "@blitzjs/auth/secure-password"
import { AuthenticatedCtx } from "blitz"
import { Role } from "@prisma/client"
import { hash256 } from "@blitzjs/auth"

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

    // If registration is not allowed, check for a valid invitation token
    if (!adminSettings?.allowRegistration || input.token) {
        // If token is provided, validate it
        if (!input.token) {
            throw new Error("Registration is currently by invitation only. Please use an invitation link.")
        }

        const hashedToken = hash256(input.token)

        // Find the token in the database
        const token = await db.token.findFirst({
            where: {
                hashedToken,
                type: "INVITATION",
                sentTo: input.email,
                expiresAt: { gt: new Date() }
            }
        })

        // If token is not found or expired, throw an error
        if (!token) {
            throw new Error("Invalid or expired invitation token.")
        }

        // Delete the token so it can't be used again
        await db.token.delete({ where: { id: token.id } })
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

    await blitzContext.session.$create({ userId: user.id, email: user.email, role: Role.USER })

    return { userId: blitzContext.session.userId, ...user, email: input.email }
}
