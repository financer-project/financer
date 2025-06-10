import { generateToken, hash256 } from "@blitzjs/auth"
import { resolver } from "@blitzjs/rpc"
import { Role } from "@prisma/client"
import { z } from "zod"
import db from "@/src/lib/db"
import { invitationMailer } from "@/src/lib/mailers/invitationMailer"

// Custom error class for already registered users
export class UserAlreadyRegisteredError extends Error {
    constructor(email: string) {
        super(`User with email ${email} is already registered.`)
        this.name = "UserAlreadyRegisteredError"
    }
}

// Define a schema for the invitation input
const InviteUserSchema = z.object({
    email: z.string().email()
})

export default resolver.pipe(
    resolver.zod(InviteUserSchema),
    resolver.authorize(Role.ADMIN),
    async function inviteUser({ email }, ctx) {
        // Check if user already exists
        const existingUser = await db.user.findFirst({
            where: { email: email.toLowerCase() }
        })

        if (existingUser) {
            throw new UserAlreadyRegisteredError(email)
        }

        // Get the current user for the inviter name
        const user = await db.user.findFirst({
            where: { id: ctx.session.userId },
            select: { firstName: true, lastName: true }
        })

        if (!user) {
            throw new Error("User not found")
        }

        const inviterName = `${user.firstName} ${user.lastName}`

        // Get admin settings for token expiration
        const adminSettings = (await db.adminSettings.findFirst())!
        const tokenExpirationHours = adminSettings.invitationTokenExpirationHours ?? 72 // Default to 72 hours if not set

        // Generate the token and expiration date
        const token = generateToken()
        const hashedToken = hash256(token)
        const expiresAt = new Date()
        expiresAt.setHours(expiresAt.getHours() + tokenExpirationHours)

        // Delete any existing invitation tokens for this email
        await db.token.deleteMany({
            where: { type: "INVITATION", sentTo: email }
        })

        // Save the new token in the database
        await db.token.create({
            data: {
                userId: ctx.session.userId,
                sentTo: email,
                type: "INVITATION",
                hashedToken,
                expiresAt
            }
        })

        // Send the invitation email
        await invitationMailer({
            to: email,
            token,
            inviterName
        }).send()

        return { success: true }
    }
)
