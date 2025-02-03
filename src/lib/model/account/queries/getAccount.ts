import { NotFoundError } from "blitz"
import { resolver } from "@blitzjs/rpc"
import db from "@/db"
import { z } from "zod"

const GetAccount = z.object({
    id: z.string().uuid().optional()
})

export default resolver.pipe(
    resolver.zod(GetAccount),
    resolver.authorize(),
    async ({ id }) => {
        const account = await db.account.findFirst({ where: { id } })

        if (!account) throw new NotFoundError()

        return account
    }
)
