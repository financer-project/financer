import { resolver } from "@blitzjs/rpc"
import db from "src/lib/db"
import { DeleteAccountSchema } from "@/src/lib/model/account/schemas"

export default resolver.pipe(
    resolver.zod(DeleteAccountSchema),
    resolver.authorize(),
    async ({ id }) => {
        return await db.account.deleteMany({ where: { id } })
    }
)
