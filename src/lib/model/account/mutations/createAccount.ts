import { resolver } from "@blitzjs/rpc"
import db from "@/db"
import { CreateAccountSchema } from "@/src/lib/model/account/schemas"

export default resolver.pipe(
    resolver.zod(CreateAccountSchema),
    resolver.authorize(),
    async (input) => {
        return await db.account.create({
            data: { ...input }
        })
    }
)
