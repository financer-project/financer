import { resolver } from "@blitzjs/rpc"
import db from "@/src/lib/db"
import { deleteUserAvatar } from "@/src/lib/util/fileStorage"

export default resolver.pipe(resolver.authorize(), async (_, ctx) => {
    const user = await db.user.findUnique({
        where: { id: ctx.session.userId }
    })

    if (user?.avatarPath) {
        deleteUserAvatar(user.avatarPath)

        await db.user.update({
            where: { id: ctx.session.userId },
            data: { avatarPath: null }
        })
    }

    return { success: true }
})
