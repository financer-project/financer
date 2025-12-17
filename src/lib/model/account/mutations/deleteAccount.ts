import { resolver } from "@blitzjs/rpc"
import db from "src/lib/db"
import { DeleteAccountSchema } from "@/src/lib/model/account/schemas"
import Guard from "@/src/lib/guard/ability"

export default resolver.pipe(
    resolver.zod(DeleteAccountSchema),
    resolver.authorize(),
    Guard.authorizePipe("delete", "Account"),
    async ({ id }) => {
        return db.account.deleteMany({ where: { id } })
    }
)
