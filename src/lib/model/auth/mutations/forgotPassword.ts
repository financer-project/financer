import { generateToken, hash256 } from "@blitzjs/auth"
import { resolver } from "@blitzjs/rpc"
import db from "@/src/lib/db"
import { forgotPasswordMailer } from "@/src/lib/mailers/forgotPasswordMailer"
import { ForgotPassword } from "@/src/app/(auth)/validations"

const RESET_PASSWORD_TOKEN_EXPIRATION_IN_HOURS = 4

// Custom error class for rate limiting
export class RecentPasswordResetError extends Error {
    constructor() {
        super("A password reset link was recently sent. Please check your email or try again later.")
        this.name = "RecentPasswordResetError"
    }
}

export default resolver.pipe(
    resolver.zod(ForgotPassword),
    async ({ email }) => {
        // 1. Get the user
        const user = await db.user.findFirst({ where: { email: email.toLowerCase() } })

        if (!user) {
            // If no user found wait the same time so attackers can't tell the difference
            await new Promise((resolve) => setTimeout(resolve, 750))
            return
        }

        // 2. Check if there's a recent token (less than 4 hours old)
        const cooldownDate = new Date()
        cooldownDate.setHours(cooldownDate.getHours() - RESET_PASSWORD_TOKEN_EXPIRATION_IN_HOURS)

        const existingToken = await db.token.findFirst({
            where: {
                userId: user.id,
                type: "RESET_PASSWORD",
                createdAt: { gt: cooldownDate }
            },
            orderBy: { createdAt: "desc" }
        })

        // If a recent token exists, throw a specific error
        if (existingToken) {
            // Simulate processing time to prevent timing attacks
            await new Promise((resolve) => setTimeout(resolve, 750))
            throw new RecentPasswordResetError()
        }

        // 3. Generate the token and expiration date.
        const token = generateToken()
        const hashedToken = hash256(token)
        const expiresAt = new Date()

        // 4. Set expiration date
        expiresAt.setHours(expiresAt.getHours() + RESET_PASSWORD_TOKEN_EXPIRATION_IN_HOURS)

        // 5. Delete any existing password reset tokens
        await db.token.deleteMany({ where: { type: "RESET_PASSWORD", userId: user.id } })

        // 6. Save this new token in the database.
        await db.token.create({
            data: {
                user: { connect: { id: user.id } },
                type: "RESET_PASSWORD",
                expiresAt,
                hashedToken,
                sentTo: user.email
            }
        })

        // 7. Send the email
        await forgotPasswordMailer({
            to: user.email,
            token
        }).send()
    }
)
