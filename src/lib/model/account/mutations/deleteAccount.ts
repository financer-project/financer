import { resolver } from "@blitzjs/rpc"
import db from "@/db"
import { DeleteAccountSchema } from "@/src/lib/model/account/schemas"

export default resolver.pipe(
    resolver.zod(DeleteAccountSchema),
    resolver.authorize(),
    async ({ id }) => {
        const account = await db.account.deleteMany({ where: { id } })

        return account
    }
)
