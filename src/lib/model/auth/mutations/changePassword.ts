import { NotFoundError } from "blitz"
import db from "@/src/lib/db"
import { authenticateUser } from "./login"
import { ChangePassword } from "@/src/app/(auth)/validations"
import { resolver } from "@blitzjs/rpc"
import { SecurePassword } from "@blitzjs/auth/secure-password"

export default resolver.pipe(
    resolver.zod(ChangePassword),
    resolver.authorize(),
    async ({ currentPassword, newPassword }, ctx) => {
        const user = await db.user.findFirst({ where: { id: ctx.session.userId } })
        if (!user) throw new NotFoundError()
        await authenticateUser(user.email, currentPassword)
        const hashedPassword = await SecurePassword.hash(newPassword.trim())
        await db.user.update({
            where: { id: user.id },
            data: { hashedPassword }
        })

        // Invalidate all other sessions for security
        await db.session.deleteMany({
            where: {
                userId: user.id,
                handle: { not: ctx.session.$handle! }
            }
        })

        return true
    }
)
