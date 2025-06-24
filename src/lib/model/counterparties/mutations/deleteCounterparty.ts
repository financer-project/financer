import { resolver } from "@blitzjs/rpc"
import { DeleteCounterpartySchema } from "../schemas"
import db from "@/src/lib/db"

export default resolver.pipe(
    resolver.zod(DeleteCounterpartySchema),
    resolver.authorize(),
    async ({ id }, ctx) => {
        return db.counterparty.deleteMany({
            where: {
                id,
                household: {
                    ownerId: ctx.session.userId
                }
            }
        })
    }
)
