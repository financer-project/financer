import { resolver } from "@blitzjs/rpc"
import db from "src/lib/db"
import { UpdateAccountSchema } from "@/src/lib/model/account/schemas"

export default resolver.pipe(
    resolver.zod(UpdateAccountSchema),
    resolver.authorize(),
    async ({ id, ...data }) => {
        return db.account.update({
            where: { id },
            data,
            include: { household: true }
        })
    }
)
