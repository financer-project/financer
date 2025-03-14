import { resolver } from "@blitzjs/rpc"
import db from "src/lib/db"
import { CreateHouseholdSchema } from "../schemas"
import { Ctx } from "blitz"
import { Household } from "@prisma/client"

export default resolver.pipe(
    resolver.zod(CreateHouseholdSchema),
    resolver.authorize(),
    async (input, ctx: Ctx): Promise<Household> => {
        return db.household.create({
            data: {
                ...input,
                ownerId: ctx.session.userId!
            }
        })
    }
)
