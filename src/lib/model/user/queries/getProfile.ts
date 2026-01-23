import { resolver } from "@blitzjs/rpc"
import { NotFoundError } from "blitz"
import db from "@/src/lib/db"

export default resolver.pipe(resolver.authorize(), async (_, ctx) => {
    const user = await db.user.findFirst({
        where: { id: ctx.session.userId },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarPath: true,
            hashedPassword: true
        }
    })

    if (!user) throw new NotFoundError()

    return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        hasAvatar: !!user.avatarPath,
        hasPassword: !!user.hashedPassword
    }
})
