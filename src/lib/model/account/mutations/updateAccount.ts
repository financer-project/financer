import { resolver } from "@blitzjs/rpc"
import db from "@/db"
import { UpdateAccountSchema } from "@/src/lib/model/account/schemas"

export default resolver.pipe(
    resolver.zod(UpdateAccountSchema),
    resolver.authorize(),
    async ({ id, ...data }) => {
        return await db.account.update({
            where: { id },
            data,
            include: { household: true }
        })
    }
)
