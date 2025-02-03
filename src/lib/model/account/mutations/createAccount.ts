import { resolver } from "@blitzjs/rpc"
import db from "@/db"
import { CreateAccountSchema } from "@/src/app/(internal)/households/[householdId]/accounts/schemas"

export default resolver.pipe(
    resolver.zod(CreateAccountSchema),
    resolver.authorize(),
    async (input) => {
        return await db.account.create({
            data: { ...input }
        })
    }
)
