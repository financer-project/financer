import { resolver } from "@blitzjs/rpc"
import db from "@/db"
import { UpdateAccountSchema } from "@/src/app/(internal)/households/[householdId]/accounts/schemas"

export default resolver.pipe(
    resolver.zod(UpdateAccountSchema),
    resolver.authorize(),
    async ({ id, ...data }) => {
        const account = await db.account.update({ where: { id }, data })

        return account
    }
)
