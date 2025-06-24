import { resolver } from "@blitzjs/rpc"
import { CreateCounterpartySchema } from "../schemas"
import db from "@/src/lib/db"
import getHousehold from "@/src/lib/model/household/queries/getHousehold"

export default resolver.pipe(
    resolver.zod(CreateCounterpartySchema),
    resolver.authorize(),
    async (input, ctx) => {
        await getHousehold({ id: input.householdId }, ctx)
        return db.counterparty.create({ data: input })
    }
)
