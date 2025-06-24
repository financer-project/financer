import { NotFoundError } from "blitz"
import { resolver } from "@blitzjs/rpc"
import db from "@/src/lib/db"
import { z } from "zod"

const GetCounterparty = z.object({
    id: z.string().uuid()
})

export default resolver.pipe(
    resolver.zod(GetCounterparty),
    resolver.authorize(),
    async ({ id }, ctx) => {
        const counterparty = await db.counterparty.findFirst({
            where: {
                id,
                household: {
                    ownerId: ctx.session.userId
                }
            }
        })

        if (!counterparty) throw new NotFoundError()

        return counterparty
    }
)
