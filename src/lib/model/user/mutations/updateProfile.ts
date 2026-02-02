import { resolver } from "@blitzjs/rpc"
import db from "@/src/lib/db"
import { UpdateProfileSchema } from "@/src/lib/model/user/schemas"

export default resolver.pipe(
    resolver.zod(UpdateProfileSchema),
    resolver.authorize(),
    async ({ firstName, lastName, email }, ctx) => {
        const userId = ctx.session.userId

        // Check if email is already taken by another user
        const existingUser = await db.user.findFirst({
            where: { email, NOT: { id: userId } }
        })

        if (existingUser) {
            throw new Error("Email is already in use")
        }

        const user = await db.user.update({
            where: { id: userId },
            data: { firstName, lastName, email }
        })

        // Update session email if changed
        if (email !== ctx.session.email) {
            await ctx.session.$setPublicData({ email })
        }

        return user
    }
)
