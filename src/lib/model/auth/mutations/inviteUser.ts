import { generateToken, hash256 } from "@blitzjs/auth"
import { resolver } from "@blitzjs/rpc"
import { Role } from "@prisma/client"
import { z } from "zod"
import db from "@/src/lib/db"
import { invitationMailer } from "@/src/lib/mailers/invitationMailer"

// Define a schema for the invitation input
const InviteUserSchema = z.object({
    email: z.string().email()
})

// Token expiration in hours
const INVITATION_TOKEN_EXPIRATION_IN_HOURS = 72 // 3 days

export default resolver.pipe(
    resolver.zod(InviteUserSchema),
    resolver.authorize(Role.ADMIN),
    async function inviteUser({ email }, ctx) {
        // Get the current user for the inviter name
        const user = await db.user.findFirst({
            where: { id: ctx.session.userId },
            select: { firstName: true, lastName: true }
        })

        if (!user) {
            throw new Error("User not found")
        }

        const inviterName = `${user.firstName} ${user.lastName}`

        // Generate the token and expiration date
        const token = generateToken()
        const hashedToken = hash256(token)
        const expiresAt = new Date()
        expiresAt.setHours(expiresAt.getHours() + INVITATION_TOKEN_EXPIRATION_IN_HOURS)

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
