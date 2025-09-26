import { AuthenticatedCtx, NotFoundError } from "blitz"
import { resolver } from "@blitzjs/rpc"
import db from "src/lib/db"
import { z } from "zod"

const GetHousehold = z.object({
    id: z.uuid()
})

export default resolver.pipe(
    resolver.zod(GetHousehold),
    resolver.authorize(),
    async ({ id }, ctx: AuthenticatedCtx) => {
        const household = await db.household.findFirst({ where: { id } })

        if (!household || household.ownerId !== ctx.session.userId) throw new NotFoundError()

        return household
    }
)
