import { NotFoundError } from "blitz"
import { resolver } from "@blitzjs/rpc"
import db from "db"
import { z } from "zod"

const GetHousehold = z.object({
    id: z.string().uuid().optional()
})

export default resolver.pipe(resolver.zod(GetHousehold), resolver.authorize(), async ({ id }) => {
    const household = await db.household.findFirst({ where: { id } })

    if (!household) throw new NotFoundError()

    return household
})
