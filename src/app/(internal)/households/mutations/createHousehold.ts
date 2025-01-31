import { resolver } from "@blitzjs/rpc"
import db from "db"
import { CreateHouseholdSchema } from "../schemas"
import { Ctx } from "blitz"

export default resolver.pipe(
    resolver.zod(CreateHouseholdSchema),
    resolver.authorize(),
    async (input, ctx: Ctx) => {
        return await db.household.create({
            data: {
                ...input,
                ownerId: ctx.session.userId!
            }
        })
    }
)
