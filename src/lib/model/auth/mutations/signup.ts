import db from "@/src/lib/db"
import { SecurePassword } from "@blitzjs/auth/secure-password"
import { AuthenticatedCtx } from "blitz"
import { Role } from "@prisma/client"

export default async function signup(
    input: {
        firstName: string
        lastName: string
        password: string
        email: string
    },
    ctx: AuthenticatedCtx
) {
    const blitzContext = ctx
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
