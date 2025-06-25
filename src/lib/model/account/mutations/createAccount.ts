import { resolver } from "@blitzjs/rpc"
import db from "src/lib/db"
import { CreateAccountSchema } from "@/src/lib/model/account/schemas"
import Guard from "@/src/lib/guard/ability"

export default resolver.pipe(
    resolver.zod(CreateAccountSchema),
    resolver.authorize(),
    Guard.authorizePipe("create", "Account"),
    async (input) => {
        return db.account.create({
            data: { ...input }
        })
    }
)
