import { resolver } from "@blitzjs/rpc"
import db from "src/lib/db"
import { CreateHouseholdSchema } from "../schemas"
import { Ctx } from "blitz"

export default resolver.pipe(
    resolver.zod(CreateHouseholdSchema),
    resolver.authorize(),
    async (input, ctx: Ctx) => {
        return db.household.create({
            data: {
                ...input,
                ownerId: ctx.session.userId!
            }
        })
    }
)
