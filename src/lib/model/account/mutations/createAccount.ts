import { resolver } from "@blitzjs/rpc"
import db from "src/lib/db"
import { CreateAccountSchema } from "@/src/lib/model/account/schemas"

export default resolver.pipe(
    resolver.zod(CreateAccountSchema),
    resolver.authorize(),
    async (input) => {
        return db.account.create({
            data: { ...input }
        })
    }
)
