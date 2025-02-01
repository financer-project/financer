import { resolver } from "@blitzjs/rpc"
import db from "@/db"
import { DeleteAccountSchema } from "@/src/app/(internal)/households/[householdId]/accounts/schemas"

export default resolver.pipe(
    resolver.zod(DeleteAccountSchema),
    resolver.authorize(),
    async ({ id }) => {
        const account = await db.account.deleteMany({ where: { id } })

        return account
    }
)
