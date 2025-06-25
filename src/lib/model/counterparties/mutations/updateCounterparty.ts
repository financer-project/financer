import { resolver } from "@blitzjs/rpc"
import { UpdateCounterpartySchema } from "../schemas"
import db from "@/src/lib/db"
import Guard from "@/src/lib/guard/ability"

export default resolver.pipe(
    resolver.zod(UpdateCounterpartySchema),
    resolver.authorize(),
    Guard.authorizePipe("update", "Counterparty"),
    async ({ id, householdId, ...data }) => {
        return db.counterparty.update({
            where: { id },
            data: { ...data, householdId }
        })
    }
)
