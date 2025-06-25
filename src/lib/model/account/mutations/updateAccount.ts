import { resolver } from "@blitzjs/rpc"
import db from "src/lib/db"
import { UpdateAccountSchema } from "@/src/lib/model/account/schemas"
import Guard from "@/src/lib/guard/ability"

export default resolver.pipe(
    resolver.zod(UpdateAccountSchema),
    resolver.authorize(),
    Guard.authorizePipe("update", "Account"),
    async ({ id, ...data }) => {
        return db.account.update({
            where: { id },
            data,
            include: { household: true }
        })
    }
)
